import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { runInNewContext } from 'node:vm';
import { SPECIES, QUESTIONS, applyAnswer, nextQuestion, answerStep, summarize, canPredict, resultSummary, deriveAssessment } from './logic.mjs';
import { createApp, loadDataset } from './server.mjs';

test('unknown never eliminates; arrangement is excluded for every species', () => {
  for (const q of QUESTIONS) assert.deepEqual(applyAnswer(SPECIES, q, 'unknown'), SPECIES);
  assert.ok(!QUESTIONS.some(q => q.id === 'arrangement'));
  assert.equal(nextQuestion(SPECIES, []).id, 'margin');
  assert.throws(() => applyAnswer(SPECIES, { id: 'arrangement' }, 'opposite'));
});
test('adaptive paths, insufficient foliar evidence, and branching', () => {
  let candidates = [...SPECIES], history = [];
  for (const answer of ['entire', 'no', 'yes']) {
    const step = answerStep(candidates, history, answer); history.push(step); candidates = step.candidatesAfter;
  }
  assert.deepEqual(history.map(s => s.questionId), ['margin', 'venation', 'underside']);
  assert.deepEqual(candidates, ['SP001']);
  assert.equal(nextQuestion(candidates, history), null);
  assert.equal(canPredict(candidates, history), true);
  candidates = [...SPECIES]; history = [];
  while (nextQuestion(candidates, history)) { const s = answerStep(candidates, history, 'unknown'); history.push(s); candidates = s.candidatesAfter; }
  assert.deepEqual(candidates, SPECIES);
  assert.equal(history.length, QUESTIONS.length);
  assert.equal(canPredict(candidates, history), false);
  assert.equal(nextQuestion(['SP004', 'SP005'], [{ questionId: 'margin' }]), null, 'Do not invent a texture or flower test');
  assert.ok(applyAnswer(['SP003', 'SP006'], QUESTIONS[1], 'yes').includes('SP006'), 'Glands alone cannot establish Bollen');
});
test('singleton continues for independent confirmation; unknown is not confirmation', () => {
  const history = [{ questionId: 'underside', answer: 'yes' }];
  assert.equal(canPredict(['SP001'], history), false);
  assert.equal(nextQuestion(['SP001'], history).id, 'margin');
  const margin = answerStep(['SP001'], history, 'unknown');
  assert.equal(margin.purpose, 'confirmation');
  history.push(margin);
  assert.equal(nextQuestion(['SP001'], history).id, 'venation');
  const unknown = answerStep(['SP001'], history, 'unknown');
  assert.equal(canPredict(['SP001'], [...history, unknown]), false);
  const matched = answerStep(['SP001'], history, 'no');
  assert.equal(canPredict(['SP001'], [...history, matched]), true);
  const contradiction = answerStep(['SP001'], history, 'yes');
  assert.deepEqual(contradiction.candidatesAfter, []);
  assert.equal(canPredict([], [...history, contradiction]), false);
});
test('LC002 regression: entire margin retains Litre; historical elimination remains readable', () => {
  const step = answerStep(SPECIES, [], 'entire');
  assert.ok(step.candidatesAfter.includes('SP002'));
  assert.equal(nextQuestion(step.candidatesAfter, [step]).id, 'venation');
  const veins = answerStep(step.candidatesAfter, [step], 'yes');
  assert.deepEqual(veins.candidatesAfter, ['SP002']);
  assert.equal(canPredict(veins.candidatesAfter, [step, veins]), true, 'Margin independently corroborates venation');
  const historical = { groundTruth: { id: 'SP002', scientificName: 'Lithraea caustica', commonName: 'Litre' },
    questions: [{ questionId: 'arrangement', question: '¿Cómo se disponen las hojas sobre la ramilla?', answerLabel: 'Opuestas / opuesto-decusadas', candidatesBefore: SPECIES, candidatesAfter: ['SP001', 'SP004', 'SP005'] }],
    finalPredictedCandidates: ['SP001'], finalOutcome: 'ambiguous', groundTruthRetainedThroughout: false, diagnosticSteps: 2 };
  const summary = resultSummary(historical, [{ id: 'SP001', scientificName: 'Cryptocarya alba', commonName: 'Peumo' }]);
  assert.equal(summary.elimination.step, 1);
  assert.equal(summary.elimination.question, historical.questions[0].question);
  assert.equal(summary.predictions[0], 'Cryptocarya alba (Peumo)');
  assert.equal(summary.outcome, 'Evidencia insuficiente / ambiguo');
});
test('exhaustive paths terminate and never resurrect eliminated candidates', () => {
  function visit(candidates, history) {
    const q = nextQuestion(candidates, history);
    assert.ok(history.length <= QUESTIONS.length);
    if (!q) return;
    for (const o of q.options) {
      const step = answerStep(candidates, history, o.value);
      assert.ok(step.candidatesAfter.every(id => candidates.includes(id)));
      visit(step.candidatesAfter, [...history, step]);
    }
  }
  visit(SPECIES, []);
});
test('automatic status preserves incomplete, insufficient, contradictory, and supported evidence', () => {
  assert.equal(deriveAssessment(SPECIES, []).evidenceStatus, 'incomplete');
  assert.equal(deriveAssessment(SPECIES, []).endedEarly, true);
  let candidates = [...SPECIES], history = [];
  while (nextQuestion(candidates, history)) {
    const step = answerStep(candidates, history, 'unknown'); history.push(step); candidates = step.candidatesAfter;
  }
  const insufficient = deriveAssessment(candidates, history);
  assert.equal(insufficient.evidenceStatus, 'insufficient');
  assert.equal(insufficient.finalOutcome, 'ambiguous');
  assert.equal(insufficient.endedEarly, false);
  assert.equal(insufficient.observableCharacterCount, 0);
  const unconfirmed = deriveAssessment(['SP001'], history);
  assert.equal(unconfirmed.finalOutcome, 'ambiguous');
  assert.equal(unconfirmed.independentConfirmation, false);
  const contradiction = { questionId: 'venation', question: 'Veins?', answer: 'yes', candidatesBefore: ['SP001'], candidatesAfter: [] };
  const conflict = deriveAssessment([], [contradiction]);
  assert.equal(conflict.evidenceStatus, 'contradictory');
  assert.equal(conflict.finalOutcome, 'ambiguous', 'No automated out-of-pilot assertion');
  assert.equal(conflict.contradictions[0].questionId, 'venation');
  candidates = [...SPECIES]; history = [];
  for (const answer of ['entire', 'no', 'yes']) {
    const step = answerStep(candidates, history, answer); history.push(step); candidates = step.candidatesAfter;
  }
  const supported = deriveAssessment(candidates, history);
  assert.equal(supported.finalOutcome, 'probable');
  assert.equal(supported.independentConfirmation, true);
  assert.equal(supported.evidenceStatus, 'supported');
});
test('presentation supports gallery, unknown answers, automatic reveal, and collapsed trace', async () => {
  const html = await readFile(new URL('./public/validation.html', import.meta.url), 'utf8');
  assert.ok(!/<select|<textarea|id="notes"|id="outcome"/.test(html));
  assert.ok(/<details id="technical">/.test(html));
  // Lightweight DOM harness exercises real client handlers without dependencies.
  const elements = new Map();
  function node() {
    return { children: [], attrs: {}, textContent: '', hidden: false, open: false,
      classList: { add() {}, remove() {}, toggle() {} },
      setAttribute(k,v) { this.attrs[k] = v; }, removeAttribute(k) { delete this[k]; },
      append(child) { this.children.push(child); }, replaceChildren(...children) { this.children = children; },
      focus() { this.focused = true; }, showModal() { this.open = true; }, close() { this.open = false; } };
  }
  for (const [, id] of html.matchAll(/id="([^"]+)"/g)) elements.set(id, node());
  const get = id => { assert.ok(elements.has(id), `Missing DOM element ${id}`); return elements.get(id); };
  let candidates = [...SPECIES], history = [], savedBody;
  const state = () => { const q = nextQuestion(candidates, history); return { validationId: 'anonymous', total: 15, assessed: 0,
    photos: ['/photo/anonymous/0', '/photo/anonymous/1'], history, question: q && { id:q.id, prompt:q.prompt, options:q.options } }; };
  const groundTruth = { id: 'SP002', scientificName: 'Lithraea caustica', commonName: 'Litre' };
  const fetch = async (url, options) => {
    let data;
    if (url.endsWith('/state')) data = { done: true, assessed: 0, total: 15 };
    else if (url.endsWith('/summary')) data = {};
    else if (url.endsWith('/start')) data = state();
    else if (url.endsWith('/answer')) {
      const step = answerStep(candidates, history, JSON.parse(options.body).answer);
      history.push(step); candidates = step.candidatesAfter; data = state();
    } else if (url.endsWith('/finish')) {
      savedBody = JSON.parse(options.body);
      const record = { ...deriveAssessment(candidates, history), groundTruth, questions: history, finalPredictedCandidates: candidates,
        groundTruthRetainedThroughout: true, diagnosticSteps: history.length };
      data = { record, resultSummary: resultSummary(record, [groundTruth]), summary: { individualsAssessed: 1 } };
    }
    return { ok: true, json: async () => data };
  };
  runInNewContext(await readFile(new URL('./public/validation.js', import.meta.url), 'utf8'), {
    document: { getElementById: get, createElement: node, querySelectorAll: () => [...elements.values()] }, fetch,
  });
  await new Promise(resolve => setImmediate(resolve));
  await get('start').onclick();
  assert.equal(get('status').textContent, 'Planta 1 de 15');
  assert.equal(get('thumbnails').children.length, 2);
  get('thumbnails').children[1].onclick();
  assert.equal(get('main-photo').src, '/photo/anonymous/1');
  get('enlarge').onclick(); assert.equal(get('photo-dialog').open, true);
  get('close-photo').onclick(); assert.equal(get('photo-dialog').open, false);
  const unknown = get('answers').children.at(-1);
  assert.equal(unknown.textContent, 'No logro verlo');
  await unknown.onclick();
  assert.equal(history[0].answer, 'unknown');
  assert.equal(get('question-title').focused, true);
  await get('finish').onclick();
  assert.deepEqual(Object.keys(savedBody).sort(), ['steps', 'validationId']);
  assert.equal(get('common-name').textContent, 'Litre');
  assert.equal(get('scientific-name').textContent, 'Lithraea caustica');
  assert.equal(get('technical').open, false);
  assert.match(get('result').textContent, /"evidenceStatus": "incomplete"/);
  assert.equal(get('reveal').hidden, false);
});
test('dataset, blind API, persistence, outcomes, and summary', async () => {
  const dataset = await loadDataset();
  assert.equal(dataset.length, 15);
  assert.equal(dataset.reduce((n, i) => n + i.photos.length, 0), 45);
  assert.equal(new Set(dataset.map(i => i.groundTruth.id)).size, 6);
  const resultsDir = await mkdtemp(join(tmpdir(), 'arboris-validation-'));
  let server;
  async function launch(items) {
    server = await createApp({ resultsDir, dataset: items });
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    return `http://127.0.0.1:${server.address().port}`;
  }
  async function close() { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  try {
    const item = dataset.find(i => i.individualId === 'CA001');
    let base = await launch([item]);
    const call = async (path, body) => {
      const r = await fetch(base + '/api/' + path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      return { status: r.status, data: await r.json() };
    };
    let s = (await call('start', {})).data;
    const blind = JSON.stringify(s);
    for (const token of ['SP001', 'CA001', 'Cryptocarya', 'Peumo', 'species/', '.jpg']) assert.ok(!blind.includes(token));
    assert.equal(s.photos.length, 3);
    const photo = await fetch(base + s.photos[0]);
    assert.equal(photo.status, 200);
    assert.deepEqual(Buffer.from(await photo.arrayBuffer()), await readFile(item.photos[0].path));
    assert.equal((await fetch(base + '/data/species/SP001_cryptocarya_alba.json')).status, 404);
    assert.equal((await fetch(base + '/api/state', { headers: { Origin: 'http://example.com' } })).status, 403);
    const context = () => ({ validationId: s.validationId, steps: s.history.length });
    assert.equal((await call('finish', { ...context(), steps: 99 })).status, 409);
    assert.equal((await call('answer', { ...context(), answer: 'invalid' })).status, 400);
    assert.equal(s.question.id, 'margin');
    for (const answer of ['entire', 'no', 'yes']) s = (await call('answer', { ...context(), answer })).data;
    assert.equal(s.candidateCount, 1);
    s = (await call('undo', context())).data;
    assert.equal(s.candidateCount, 2);
    s = (await call('answer', { ...context(), answer: 'yes' })).data;
    const finished = await call('finish', context());
    assert.equal(finished.data.record.finalIdentificationMatchedGroundTruth, true);
    assert.equal(finished.data.record.diagnosticSteps, 3);
    assert.equal(finished.data.record.logicVersion, 'foliar-conservative-2');
    assert.equal(finished.data.record.schemaVersion, 3);
    assert.equal(finished.data.record.evidenceStatus, 'supported');
    assert.equal(finished.data.record.independentConfirmation, true);
    assert.equal(finished.data.resultSummary.groundTruth, 'Cryptocarya alba (Peumo)');
    assert.equal(finished.data.resultSummary.elimination, null);
    assert.equal((await readdir(resultsDir)).length, 1);
    assert.equal((await fetch(base + s.photos[0])).status, 404);
    await close(); base = await launch([item]);
    assert.equal((await call('summary')).data.correctIdentifications, 1);
    assert.equal((await call('start', {})).data.done, true);
    // A caller cannot force probable by posting removed form fields.
    await close(); base = await launch([dataset.find(i => i.individualId === 'LC002')]);
    s = (await call('start', {})).data;
    const early = await call('finish', { ...context(), outcome: 'probable', notes: 'Ignored UI field' });
    assert.equal(early.data.record.finalOutcome, 'ambiguous');
    assert.equal(early.data.record.evidenceStatus, 'incomplete');
    assert.equal(early.data.record.endedEarly, true);
    assert.equal(early.data.record.pendingQuestionId, 'margin');
    assert.equal(early.data.record.notes, '');
    assert.equal(early.data.record.groundTruthRetainedThroughout, true);
    assert.equal(early.data.record.finalIdentificationMatchedGroundTruth, null);
    assert.equal(early.data.record.finalPredictedCandidates.length, 6);
    await close(); base = await launch([dataset.find(i => i.individualId === 'CA002')]);
    s = (await call('start', {})).data;
    while (s.question) s = (await call('answer', { ...context(), answer: 'unknown' })).data;
    const unknown = await call('finish', context());
    assert.equal(unknown.data.record.evidenceStatus, 'insufficient');
    assert.equal(unknown.data.record.endedEarly, false);
    assert.equal(unknown.data.record.charactersUnobservable.length, QUESTIONS.length);
    assert.equal(unknown.data.record.questions.length, QUESTIONS.length);
    assert.deepEqual(unknown.data.record.contradictions, []);
    const r = finished.data.record;
    const wrongStep = answerStep(SPECIES, [], 'toothed');
    const wrong = { ...r, groundTruth: { id: 'SP002' }, questions: [wrongStep], finalOutcome: 'probable', finalIdentificationMatchedGroundTruth: false, groundTruthRetainedThroughout: false, diagnosticSteps: 1 };
    const ambiguous = { ...r, finalOutcome: 'ambiguous', finalIdentificationMatchedGroundTruth: null, questions: [answerStep(SPECIES, [], 'unknown')], diagnosticSteps: 1 };
    const summary = summarize([r, wrong, ambiguous, { ...r, finalOutcome: 'none', finalIdentificationMatchedGroundTruth: false }]);
    assert.equal(summary.incorrectIdentifications, 1);
    assert.equal(summary.ambiguousOutcomes, 1);
    assert.equal(summary.noneOfPilotOutcomes, 1);
    assert.equal(summary.incorrectEliminationsByQuestion.margin, 1);
    assert.equal(summary.charactersUnobservable.margin, 1);
  } finally { if (server?.listening) await close(); await rm(resultsDir, { recursive: true, force: true }); }
});

