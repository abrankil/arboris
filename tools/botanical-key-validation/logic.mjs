// Conservative photographic adaptation of BOTANICAL_KEY_PILOT.md v1.0.
import { adaptSpeciesRecords } from './species_adapter.mjs';
import SP001 from '../../data/species/SP001_cryptocarya_alba.json' with { type: 'json' };
import SP002 from '../../data/species/SP002_lithraea_caustica.json' with { type: 'json' };
import SP003 from '../../data/species/SP003_kageneckia_oblonga.json' with { type: 'json' };
import SP004 from '../../data/species/SP004_podanthus_mitiqui.json' with { type: 'json' };
import SP005 from '../../data/species/SP005_colliguaja_odorifera.json' with { type: 'json' };
import SP006 from '../../data/species/SP006_quillaja_saponaria.json' with { type: 'json' };

export const SPECIES = ['SP001', 'SP002', 'SP003', 'SP004', 'SP005', 'SP006'];
const VENATION_STATES = Object.fromEntries(
  adaptSpeciesRecords([SP001, SP002, SP003, SP004, SP005, SP006])
    .filter(record => record.states.venation.length > 0)
    .map(record => [record.id, record.states.venation]),
);
const question = (id, branch, prompt, options, states) => ({ id, branch, prompt,
  options: [...options.map(([value, label]) => ({ value, label })),
    { value: 'unknown', label: 'No sé / no puedo observarlo' }], states });
// Unspecified taxa are unconstrained: the source key does not establish their
// state at this branch. Never turn missing botanical knowledge into exclusion.
export const QUESTIONS = [
  question('margin', '2, 3, 4, 5', '¿Cómo se ve el margen de las hojas?',
    [['entire', 'Entero / ondulado, sin dientes visibles'], ['toothed', 'Serrado / dentado']],
    { SP001: ['entire'], SP002: ['entire'], SP003: ['toothed'], SP004: ['toothed'], SP005: ['toothed'], SP006: ['entire', 'toothed'] }),
  question('glands', '3a (componente foliar)', '¿Se ven pequeñas glándulas en los dientes de un margen claramente aserrado?',
    [['yes', 'Sí, combinación visible'], ['no', 'No: la combinación se puede descartar visualmente']],
    { SP003: ['yes'] }),
  question('venation', '4', '¿El nervio medio es claramente prominente sobre la lámina?',
    [['yes', 'Sí, coincide'], ['no', 'No, sin ese contraste y relieve']],
    VENATION_STATES),
  question('underside', '5', 'Comparando haz y envés: ¿el envés es notoriamente más claro, blanquecino o glauco?',
    [['yes', 'Sí, contraste marcado'], ['no', 'No, sin contraste marcado']],
    { SP001: ['yes'], SP006: ['no'] }),
];
export function applyAnswer(candidates, q, answer) {
  if (!QUESTIONS.includes(q)) throw new Error('Excluded or unsupported diagnostic character');
  if (!q.options.some(o => o.value === answer)) throw new Error('Invalid answer');
  return answer === 'unknown' ? [...candidates] : candidates.filter(id => !q.states[id] || q.states[id].includes(answer));
}
export function nextQuestion(candidates, history) {
  if (!candidates.length) return null;
  const remaining = QUESTIONS.filter(q => !history.some(h => h.questionId === q.id));
  if (!history.length) return QUESTIONS[0]; // Margin always starts the pilot flow.
  // A singleton still receives every available independent, documented check.
  if (candidates.length === 1) return remaining.find(q => q.states[candidates[0]]?.length === 1) ?? null;
  const scored = remaining.map(q => {
    const sizes = q.options.filter(o => o.value !== 'unknown').map(o => applyAnswer(candidates, q, o.value).length);
    return { q, sizes, worst: Math.max(...sizes), total: sizes.reduce((a, b) => a + b, 0) };
  }).filter(s => s.sizes.some(n => n > 0 && n < candidates.length));
  // Minimize worst-case survivors, then total survivors; source order breaks ties.
  scored.sort((a, b) => a.worst - b.worst || a.total - b.total);
  return scored[0]?.q ?? null;
}
export function confirmationEvidence(candidates, history) {
  if (candidates.length !== 1) return [];
  return [...new Set(history.filter(s => {
    const q = QUESTIONS.find(q => q.id === s.questionId);
    const states = q?.states[candidates[0]];
    return s.answer !== 'unknown' && states?.length === 1 && states.includes(s.answer);
  }).map(s => s.questionId))];
}
export function canPredict(candidates, history) {
  return confirmationEvidence(candidates, history).length >= 2 && !nextQuestion(candidates, history);
}
// Outcome policy only: botanical filtering and confirmation stay unchanged.
export function deriveAssessment(candidates, history) {
  const pending = nextQuestion(candidates, history);
  const contradictions = history.flatMap((s, i) => s.candidatesBefore.length && !s.candidatesAfter.length
    ? [{ step: i + 1, questionId: s.questionId, question: s.question, answer: s.answer }] : []);
  const contradictory = candidates.length === 0 || contradictions.length > 0;
  const probable = !contradictory && canPredict(candidates, history);
  return {
    outcomePolicyVersion: 'automatic-1', finalOutcome: probable ? 'probable' : 'ambiguous',
    evidenceStatus: contradictory ? 'contradictory' : pending ? 'incomplete' : probable ? 'supported' : 'insufficient',
    endedEarly: !!pending, pendingQuestionId: pending?.id ?? null,
    independentConfirmation: confirmationEvidence(candidates, history).length >= 2,
    observableCharacterCount: history.filter(s => s.answer !== 'unknown').length, contradictions,
  };
}
export function resultSummary(record, species) {
  const label = id => {
    const s = species.find(s => s.id === id);
    return s ? `${s.scientificName} (${s.commonName})` : id;
  };
  const index = record.questions.findIndex(s => s.candidatesBefore.includes(record.groundTruth.id) && !s.candidatesAfter.includes(record.groundTruth.id));
  const names = { margin: 'margen foliar', glands: 'glándulas en los dientes', venation: 'nervadura', underside: 'contraste entre haz y envés', arrangement: 'disposición foliar' };
  return {
    commonName: record.groundTruth.commonName, scientificName: record.groundTruth.scientificName,
    consistency: index >= 0 ? 'La clave descartó la especie real' : record.finalOutcome === 'probable' ? 'La clave fue consistente con la especie real' : 'Compatible con la especie real, sin identificación suficiente',
    explanation: index < 0 ? 'La especie permaneció entre las candidatas durante todo el recorrido.' : `La especie real fue descartada en la pregunta sobre ${names[record.questions[index].questionId] ?? 'un carácter foliar'}.`,
    evidenceExplanation: record.evidenceStatus === 'contradictory'
      ? 'Las respuestas dejaron a todas las especies fuera de la clave. Esto indica una contradicción con la clave, no demuestra que la planta esté fuera del piloto.'
      : record.endedEarly ? 'Terminaste antes de completar las preguntas disponibles. La evaluación quedó con evidencia incompleta.'
      : record.finalOutcome === 'probable' ? 'Los caracteres observados aportaron confirmación independiente para una identificación probable.'
      : record.finalPredictedCandidates.length !== 1 ? 'La evidencia disponible no fue suficiente para distinguir una sola especie.'
      : 'Quedó una candidata, pero faltó evidencia independiente para confirmarla.',
    groundTruth: `${record.groundTruth.scientificName} (${record.groundTruth.commonName})`,
    outcome: { probable: 'Identificación probable', ambiguous: 'Evidencia insuficiente / ambiguo', none: 'Ninguna de las seis especies del piloto' }[record.finalOutcome],
    predictions: record.finalPredictedCandidates.map(label),
    survived: record.groundTruthRetainedThroughout,
    elimination: index < 0 ? null : { step: index + 1, question: record.questions[index].question, answer: record.questions[index].answerLabel },
    diagnosticSteps: record.diagnosticSteps,
  };
}
export function answerStep(candidates, history, answer) {
  const q = nextQuestion(candidates, history);
  if (!q) throw new Error('No diagnostic question remains');
  const after = applyAnswer(candidates, q, answer);
  return { questionId: q.id, branch: q.branch, purpose: candidates.length === 1 ? 'confirmation' : 'discrimination', question: q.prompt, answer,
    answerLabel: q.options.find(o => o.value === answer).label,
    candidatesBefore: [...candidates], candidatesAfter: after,
    timestamp: new Date().toISOString() };
}
export function summarize(records) {
  const unobservable = {}, eliminations = {};
  for (const r of records) for (const s of r.questions) {
    if (s.answer === 'unknown') unobservable[s.questionId] = (unobservable[s.questionId] ?? 0) + 1;
    if (s.candidatesBefore.includes(r.groundTruth.id) && !s.candidatesAfter.includes(r.groundTruth.id))
      eliminations[s.questionId] = (eliminations[s.questionId] ?? 0) + 1;
  }
  return { individualsAssessed: records.length,
    correctIdentifications: records.filter(r => r.finalIdentificationMatchedGroundTruth === true).length,
    ambiguousOutcomes: records.filter(r => r.finalOutcome === 'ambiguous').length,
    incorrectIdentifications: records.filter(r => r.finalOutcome === 'probable' && !r.finalIdentificationMatchedGroundTruth).length,
    noneOfPilotOutcomes: records.filter(r => r.finalOutcome === 'none').length,
    groundTruthEliminated: records.filter(r => !r.groundTruthRetainedThroughout).length,
    averageDiagnosticSteps: records.length ? records.reduce((n, r) => n + r.diagnosticSteps, 0) / records.length : 0,
    charactersUnobservable: Object.fromEntries(Object.entries(unobservable).sort((a,b) => b[1]-a[1])),
    incorrectEliminationsByQuestion: eliminations };
}
