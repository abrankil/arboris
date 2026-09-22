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
