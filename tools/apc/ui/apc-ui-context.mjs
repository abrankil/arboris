export function createWriterContextGate(initialState = 'ERROR') {
  let contextState = initialState;
  return {
    get state() { return contextState; },
    canAccept(hasWriterAuthority) {
      return contextState === 'READY' && Boolean(hasWriterAuthority);
    },
    beginReplacement() {
      if (contextState === 'REPLACING') return false;
      contextState = 'REPLACING';
      return true;
    },
    finish(nextState) {
      if (!['READY','READ_ONLY','ERROR'].includes(nextState)) {
        throw new RangeError('invalid context state');
      }
      contextState = nextState;
    },
  };
}

export function createWriterIntentLeaseRegistry() {
  let nextLeaseId = 1;
  const active = new Map();
  const drainWaiters = new Set();

  function resolveDrainIfEmpty() {
    if (active.size !== 0) return;
    for (const resolve of drainWaiters) resolve();
    drainWaiters.clear();
  }

  return {
    begin({ executorRef, sessionEpoch, contextGeneration, canAccept }) {
      if (!canAccept || !executorRef) return null;
      const lease = Object.freeze({
        leaseId: nextLeaseId++,
        executorRef,
        sessionEpoch,
        contextGeneration,
      });
      active.set(lease.leaseId, lease);
      return lease;
    },
    isActive(lease) {
      return Boolean(lease) && active.get(lease.leaseId) === lease;
    },
    release(lease) {
      if (!lease || active.get(lease.leaseId) !== lease) return false;
      active.delete(lease.leaseId);
      resolveDrainIfEmpty();
      return true;
    },
    waitForDrain() {
      if (active.size === 0) return Promise.resolve();
      return new Promise(resolve => {
        drainWaiters.add(resolve);
      });
    },
    get size() {
      return active.size;
    },
  };
}

export function leaseAuthorizesExecutor(lease, {
  executorRef,
  sessionEpoch,
  contextGeneration,
  isActive,
}) {
  return Boolean(
    lease &&
    isActive &&
    lease.executorRef === executorRef &&
    lease.sessionEpoch === sessionEpoch &&
    lease.contextGeneration === contextGeneration
  );
}
