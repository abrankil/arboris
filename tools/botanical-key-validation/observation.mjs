import { SPECIES, QUESTIONS, nextQuestion, answerStep, applyAnswer, deriveAssessment } from './logic.mjs';

// Observation (photos), human evidence, candidates, and hypothesis are separate.
export function createObservation(id) {
  return { id, photos: [], history: [], events: [], candidates: [...SPECIES], hypothesis: null };
}
export function recordAnswer(observation, answer) {
  observation.comparison = null;
  const step = answerStep(observation.candidates, observation.history, answer);
  observation.history.push(step);
  observation.candidates = step.candidatesAfter;
  observation.events.push({ type: 'answer', ...step });
  observation.hypothesis = null;
}
export function undoAnswer(observation) {
  observation.comparison = null;
  const step = observation.history.pop();
  if (step) {
    observation.candidates = step.candidatesBefore;
    observation.events.push({ type: 'undo', questionId: step.questionId, timestamp: new Date().toISOString() });
    observation.hypothesis = null;
  }
}
const viewRequests = {
  margin: 'Otra vista donde se vea una hoja completa y su borde podría ayudarnos.',
  glands: 'Una fotografía cercana de los dientes del borde podría ayudarnos a ver sus pequeñas glándulas.',
  venation: 'Otra vista donde se distingan las nervaduras de la hoja podría ayudarnos.',
  underside: 'Para distinguir mejor estas opciones, necesitamos ver el envés de una hoja junto al haz.',
};
export function additionalPhotoRequest(observation) {
  // Only revisit an unobservable character that can still discriminate or confirm.
  if (!observation.candidates.length) return null;
  for (const step of observation.history.filter(s => s.answer === 'unknown')) {
    const q = QUESTIONS.find(q => q.id === step.questionId);
    const useful = observation.candidates.length === 1 ? q.states[observation.candidates[0]]?.length === 1
      : q.options.some(o => { const n = applyAnswer(observation.candidates, q, o.value).length; return n > 0 && n < observation.candidates.length; });
    if (useful) return { questionId: q.id, message: viewRequests[q.id] };
  }
  return null;
}
export function addPhoto(observation, photo, request = null) {
  observation.comparison = null;
  observation.photos.push(photo);
  observation.events.push({ type: 'photo-added', photoId: photo.id, requestedCharacter: request?.questionId ?? null, timestamp: new Date().toISOString() });
  if (request) {
    // Preserve original unknown in the audit trail; reopen it in effective evidence.
    observation.history = observation.history.filter(s => !(s.questionId === request.questionId && s.answer === 'unknown'));
  }
  observation.hypothesis = null;
}
export function shouldCompare(observation) {
  return observation.photos.length > 0 && observation.candidates.length === 2
    && !nextQuestion(observation.candidates, observation.history)
    && !observation.history.some(s => s.candidatesAfter.length === 0);
}
export function recordComparison(observation, references, choice) {
  if (!shouldCompare(observation) || !['A', 'B', 'none'].includes(choice)) throw new Error('Comparison not applicable');
  if (references.length !== 2 || references.some((r,i) => r.speciesId !== observation.candidates[i] || r.images.length !== 1)) throw new Error('Invalid references');
  const before = [...observation.candidates];
  const preferred = choice === 'none' ? null : before[choice === 'A' ? 0 : 1];
  const support = Object.fromEntries(before.map(id => [id, id === preferred ? 1 : 0]));
  observation.comparison = { candidatesShown: before, references: references.map(r => ({ speciesId: r.speciesId,
    photographs: r.images.map(p => ({ id:p.id, sourcePhotoId:p.sourcePhotoId })) })),
    choice, noneSelected: choice === 'none', preferredCandidate: preferred,
    candidatesBefore: before, candidatesAfter: [...before], supportBefore: Object.fromEntries(before.map(id=>[id,0])), supportAfter: support,
    timestamp: new Date().toISOString() };
  observation.events.push({ type: 'visual-comparison', ...observation.comparison });
  observation.hypothesis = null;
}
export function identify(observation) {
  const assessment = deriveAssessment(observation.candidates, observation.history);
  const status = !observation.candidates.length ? 'none' : assessment.finalOutcome === 'probable' ? 'supported' : 'ambiguous';
  const comparison = observation.comparison && shouldCompare(observation)
    && observation.comparison.candidatesShown.every((id,i) => observation.candidates[i] === id)
    ? observation.comparison : null;
  const hypothesis = { status, candidates: [...observation.candidates], ...assessment,
    visualSupport: comparison?.supportAfter ?? {}, preferredCandidate: comparison?.preferredCandidate ?? null,
    comparisonNone: comparison?.noneSelected ?? false,
    timestamp: new Date().toISOString(), method: 'human-assisted-foliar-key',
    evidence: observation.history.filter(s => s.answer !== 'unknown').map(s => ({ character: s.questionId, state: s.answer, label: s.answerLabel })) };
  observation.hypothesis = hypothesis;
  observation.events.push({ type: 'hypothesis', ...hypothesis });
  return hypothesis;
}
export function trace(observation) {
  return { schemaVersion: 1, logicVersion: 'foliar-conservative-2', observationId: observation.id,
    photos: observation.photos.map(({ id, type, size }) => ({ id, type, size })),
    history: observation.history, events: observation.events, comparison: observation.comparison ?? null, hypothesis: observation.hypothesis };
}
export async function imageType(file) {
  if (!file.size || file.size > 20 * 1024 * 1024) throw new Error('Elige una fotografía de hasta 20 MB.');
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (b[0] === 255 && b[1] === 216 && b[2] === 255) return 'image/jpeg';
  if ([137,80,78,71,13,10,26,10].every((n,i) => b[i] === n)) return 'image/png';
  if (String.fromCharCode(...b.slice(0,4)) === 'RIFF' && String.fromCharCode(...b.slice(8,12)) === 'WEBP') return 'image/webp';
  throw new Error('Elige una fotografía JPG, JPEG, PNG o WEBP válida.');
}
export { nextQuestion };
