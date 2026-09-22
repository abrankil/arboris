import {
  applyApcTransaction,
  createApcSession,
} from './apc-i12-transactions.mjs';
import {
  validateApcWritableWorkingSnapshot,
} from './apc-i12-contract.mjs';

function parseStored(raw) {
  if (raw == null) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : structuredClone(raw);
}

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function createMemoryApcPersistence(initialEntries = []) {
  const store = new Map(initialEntries.map(([key, value]) => [key, JSON.stringify(value)]));
  return {
    async load(sessionId) {
      const raw = store.get(sessionId);
      return raw == null ? null : raw;
    },
    async saveAtomic(sessionId, serializedSession) {
      const parsed = JSON.parse(serializedSession);
      if (parsed.sessionId !== sessionId) throw new Error('saveAtomic sessionId mismatch');
      store.set(sessionId, serializedSession);
    },
    _store: store,
  };
}

export function createLocalStorageApcPersistence(storage, { prefix = 'arboris-apc:' } = {}) {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new TypeError('storage with getItem/setItem is required');
  }
  return {
    async load(sessionId) {
      return storage.getItem(`${prefix}${sessionId}`);
    },
    async saveAtomic(sessionId, serializedSession) {
      const parsed = JSON.parse(serializedSession);
      if (parsed.sessionId !== sessionId) throw new Error('saveAtomic sessionId mismatch');
      // One complete string replacement is the atomic persistence primitive for localStorage.
      storage.setItem(`${prefix}${sessionId}`, serializedSession);
    },
  };
}

export function createBrowserWriterLockProvider(lockManager = globalThis.navigator?.locks) {
  return {
    async acquire(sessionId) {
      if (!lockManager || typeof lockManager.request !== 'function') return null;
      let releaseHold;
      let resolveAcquired;
      const acquired = new Promise(resolve => { resolveAcquired = resolve; });
      const hold = new Promise(resolve => { releaseHold = resolve; });
      const requestDone = lockManager.request(
        `arboris-apc:${sessionId}`,
        { mode: 'exclusive', ifAvailable: true },
        async lock => {
          if (!lock) {
            resolveAcquired(null);
            return;
          }
          resolveAcquired({
            sessionId,
            release() { releaseHold(); },
            done: null,
          });
          await hold;
        },
      );
      const handle = await acquired;
      if (!handle) {
        await requestDone;
        return null;
      }
      handle.done = requestDone;
      return handle;
    },
  };
}

export function createMemoryWriterLockProvider() {
  const held = new Set();
  return {
    async acquire(sessionId) {
      if (held.has(sessionId)) return null;
      held.add(sessionId);
      let released = false;
      return {
        sessionId,
        release() {
          if (!released) {
            released = true;
            held.delete(sessionId);
          }
        },
        done: Promise.resolve(),
      };
    },
    _held: held,
  };
}

export class ApcI12CommandExecutor {
  constructor({ persistence, lockProvider, context }) {
    if (!persistence?.load || !persistence?.saveAtomic) throw new TypeError('persistence load/saveAtomic is required');
    if (!lockProvider?.acquire) throw new TypeError('lockProvider.acquire is required');
    this.persistence = persistence;
    this.lockProvider = lockProvider;
    this.context = context;
    this.currentSession = null;
    this.sessionEpoch = 0;
    this.runtimeGeneration = 0;
    this.writerLock = null;
    this.accepting = false;
    this.tail = Promise.resolve();
  }

  snapshot() {
    return this.currentSession ? structuredClone(this.currentSession) : null;
  }

  commandBase(extra = {}) {
    if (!this.currentSession) throw new Error('No active APC session');
    return {
      targetSessionId: this.currentSession.sessionId,
      baseSessionEpoch: this.sessionEpoch,
      baseCommitGeneration: this.runtimeGeneration,
      ...extra,
    };
  }

  async #releaseWriter() {
    if (!this.writerLock) return;
    const handle = this.writerLock;
    this.writerLock = null;
    handle.release();
    try { await handle.done; } catch {}
  }

  async close() {
    this.accepting = false;
    await this.tail;
    await this.#releaseWriter();
    this.currentSession = null;
    this.sessionEpoch += 1;
    this.runtimeGeneration = 0;
  }

  async bootstrap({ objective }) {
    await this.close();
    const built = createApcSession({ objective, context: this.context });
    if (built.status !== 'READY_TO_COMMIT') return built;

    const session = built.session;
    const lock = await this.lockProvider.acquire(session.sessionId);
    if (!lock) return { status: 'READ_ONLY', session: null, errors: ['writer lock unavailable'], warnings: [], decisionsRequired: [] };

    const existing = await this.persistence.load(session.sessionId);
    if (existing != null) {
      lock.release();
      return { status: 'IMPORT_CONFLICT', session: null, errors: ['sessionId already exists'], warnings: [], decisionsRequired: [] };
    }

    try {
      await this.persistence.saveAtomic(session.sessionId, JSON.stringify(session));
    } catch (error) {
      lock.release();
      return { status: 'REJECTED', session: null, errors: [error.message], warnings: [], decisionsRequired: [] };
    }

    this.writerLock = lock;
    this.currentSession = structuredClone(session);
    this.sessionEpoch += 1;
    this.runtimeGeneration = 0;
    this.accepting = true;
    return { status: 'COMMITTED', session: this.snapshot(), errors: [], warnings: [], decisionsRequired: [] };
  }

  async openAsWriter(sessionId) {
    await this.close();
    const lock = await this.lockProvider.acquire(sessionId);
    if (!lock) return { status: 'READ_ONLY', session: null, errors: ['writer lock unavailable'], warnings: [], decisionsRequired: [] };

    let session;
    try {
      session = parseStored(await this.persistence.load(sessionId));
    } catch (error) {
      lock.release();
      return { status: 'REJECTED', session: null, errors: [error.message], warnings: [], decisionsRequired: [] };
    }
    if (!session) {
      lock.release();
      return { status: 'REJECTED', session: null, errors: ['session not found'], warnings: [], decisionsRequired: [] };
    }

    const validation = validateApcWritableWorkingSnapshot(session, this.context);
    if (!validation.valid) {
      lock.release();
      return { status: 'READ_ONLY', session: structuredClone(session), errors: validation.errors, warnings: [], decisionsRequired: [] };
    }

    this.writerLock = lock;
    this.currentSession = structuredClone(session);
    this.sessionEpoch += 1;
    this.runtimeGeneration = 0;
    this.accepting = true;
    return { status: 'COMMITTED', session: this.snapshot(), errors: [], warnings: [], decisionsRequired: [] };
  }

  dispatch(command) {
    if (!this.accepting || !this.currentSession || !this.writerLock) {
      return Promise.resolve({ status: 'READ_ONLY', session: this.snapshot(), errors: ['write mode is not active'], warnings: [], decisionsRequired: [] });
    }

    const captured = structuredClone({
      ...command,
      targetSessionId: command.targetSessionId ?? this.currentSession.sessionId,
      baseSessionEpoch: command.baseSessionEpoch ?? this.sessionEpoch,
      baseCommitGeneration: command.baseCommitGeneration ?? this.runtimeGeneration,
    });

    const run = () => this.#execute(captured);
    const result = this.tail.then(run, run);
    this.tail = result.then(() => undefined, () => undefined);
    return result;
  }

  async #execute(command) {
    if (
      !this.accepting ||
      !this.currentSession ||
      command.targetSessionId !== this.currentSession.sessionId ||
      command.baseSessionEpoch !== this.sessionEpoch ||
      command.baseCommitGeneration !== this.runtimeGeneration
    ) {
      return { status: 'STALE_COMMAND', session: this.snapshot(), errors: ['command freshness precondition failed'], warnings: [], decisionsRequired: [] };
    }

    let durable;
    try {
      durable = parseStored(await this.persistence.load(this.currentSession.sessionId));
    } catch (error) {
      return { status: 'REJECTED', session: this.snapshot(), errors: [error.message], warnings: [], decisionsRequired: [] };
    }

    if (!durable || !sameJson(durable, this.currentSession)) {
      return { status: 'STALE_COMMAND', session: this.snapshot(), errors: ['durable snapshot no longer matches currentSession'], warnings: [], decisionsRequired: [] };
    }

    const tx = applyApcTransaction({
      previousSession: durable,
      command,
      context: this.context,
    });

    if (tx.status !== 'READY_TO_COMMIT') {
      return {
        status: tx.status,
        session: this.snapshot(),
        errors: tx.errors ?? [],
        warnings: [],
        decisionsRequired: tx.decisionsRequired ?? [],
        created: tx.created ?? null,
      };
    }

    const serialized = JSON.stringify(tx.nextSession);
    try {
      await this.persistence.saveAtomic(tx.nextSession.sessionId, serialized);
    } catch (error) {
      return { status: 'REJECTED', session: this.snapshot(), errors: [error.message], warnings: [], decisionsRequired: [] };
    }

    this.currentSession = structuredClone(tx.nextSession);
    this.runtimeGeneration += 1;
    return {
      status: 'COMMITTED',
      session: this.snapshot(),
      errors: [],
      warnings: [],
      decisionsRequired: [],
      created: tx.created ?? null,
    };
  }

  async importSession(raw) {
    this.accepting = false;
    await this.tail;

    let candidate;
    try {
      candidate = typeof raw === 'string' ? JSON.parse(raw) : structuredClone(raw);
    } catch (error) {
      return { status: 'REJECTED', session: this.snapshot(), errors: [error.message], warnings: [], decisionsRequired: [] };
    }

    const validation = validateApcWritableWorkingSnapshot(candidate, this.context);
    if (!validation.valid) {
      return { status: 'READ_ONLY', session: structuredClone(candidate), errors: validation.errors, warnings: [], decisionsRequired: [] };
    }

    await this.#releaseWriter();
    this.currentSession = null;
    this.sessionEpoch += 1;
    this.runtimeGeneration = 0;

    const lock = await this.lockProvider.acquire(candidate.sessionId);
    if (!lock) return { status: 'READ_ONLY', session: structuredClone(candidate), errors: ['writer lock unavailable'], warnings: [], decisionsRequired: [] };

    const existingRaw = await this.persistence.load(candidate.sessionId);
    if (existingRaw != null) {
      const existing = parseStored(existingRaw);
      if (!sameJson(existing, candidate)) {
        lock.release();
        return { status: 'IMPORT_CONFLICT', session: null, errors: ['different durable snapshot already exists for sessionId'], warnings: [], decisionsRequired: [] };
      }
    } else {
      try {
        await this.persistence.saveAtomic(candidate.sessionId, JSON.stringify(candidate));
      } catch (error) {
        lock.release();
        return { status: 'REJECTED', session: null, errors: [error.message], warnings: [], decisionsRequired: [] };
      }
    }

    this.writerLock = lock;
    this.currentSession = structuredClone(candidate);
    this.sessionEpoch += 1;
    this.runtimeGeneration = 0;
    this.accepting = true;
    return { status: existingRaw == null ? 'COMMITTED' : 'NO_OP', session: this.snapshot(), errors: [], warnings: [], decisionsRequired: [] };
  }
}
