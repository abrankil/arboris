import http from 'node:http';
import { readFile, readdir, mkdir, writeFile, access } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, randomInt, createHash } from 'node:crypto';
import { SPECIES, nextQuestion, answerStep, summarize, canPredict, confirmationEvidence, resultSummary, deriveAssessment } from './logic.mjs';
import { referenceLibrary } from './references.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
export async function loadDataset(root = ROOT) {
  const individuals = [];
  for (const file of (await readdir(resolve(root, 'data/species'))).filter(f => f.endsWith('.json')).sort()) {
    const profile = JSON.parse(await readFile(resolve(root, 'data/species', file), 'utf8'));
    if (!SPECIES.includes(profile.id)) continue;
    const groups = new Map();
    for (const photo of profile.photos) {
      if (!photo.individualId || basename(photo.file) !== photo.file) throw new Error('Invalid photo metadata');
      const path = resolve(root, 'species', file.slice(0, -5), 'photos', photo.file);
      await access(path);
      if (!groups.has(photo.individualId)) groups.set(photo.individualId, []);
      groups.get(photo.individualId).push({ ...photo, path });
    }
    for (const [individualId, photos] of groups) individuals.push({ individualId, photos,
      groundTruth: { id: profile.id, scientificName: profile.scientificName, commonName: profile.commonName } });
  }
  return individuals;
}

export async function createApp({ resultsDir = resolve(HERE, 'results'), dataset } = {}) {
  dataset ??= await loadDataset();
  const references = referenceLibrary(dataset);
  let records = [];
  try {
    for (const f of (await readdir(resultsDir)).filter(f => f.endsWith('.json')))
      records.push(JSON.parse(await readFile(resolve(resultsDir, f), 'utf8')));
  } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const keyHash = createHash('sha256').update(await readFile(resolve(ROOT, 'docs/BOTANICAL_KEY_PILOT.md'))).digest('hex');
  let active = null;
  const completed = item => records.some(r => r.groundTruth.id === item.groundTruth.id && r.individualId === item.individualId);
  function publicState() {
    if (!active) return { done: true, assessed: records.length, total: dataset.length };
    const q = nextQuestion(active.candidates, active.history);
    return { validationId: active.id, assessed: records.length, total: dataset.length,
      photos: active.item.photos.map((_, i) => `/photo/${active.id}/${i}`),
      candidateCount: active.candidates.length,
      question: q ? { id: q.id, prompt: q.prompt, options: q.options } : null,
      history: active.history.map(s => ({ question: s.question, answer: s.answerLabel, candidateCount: s.candidatesAfter.length })),
      canPredict: canPredict(active.candidates, active.history) };
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const json = (value, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)); };
    try {
      // Restrict browser requests to this loopback origin (including DNS rebinding).
      const expectedHost = `127.0.0.1:${server.address().port}`;
      if (req.headers.host !== expectedHost || (req.headers.origin && req.headers.origin !== `http://${expectedHost}`)) return json({ error: 'Local origin required' }, 403);
      const path = new URL(req.url, `http://${expectedHost}`).pathname;
      const assets = { '/': 'public/index.html', '/app.js': 'public/app.js', '/style.css': 'public/style.css',
        '/validation': 'public/validation.html', '/validation/': 'public/validation.html', '/validation.js': 'public/validation.js',
        '/logic.mjs': 'logic.mjs', '/observation.mjs': 'observation.mjs' };
      if (req.method === 'GET' && assets[path]) {
        const file = assets[path];
        res.setHeader('Content-Type', file.endsWith('.html') ? 'text/html; charset=utf-8' : /\.m?js$/.test(file) ? 'text/javascript; charset=utf-8' : 'text/css; charset=utf-8');
        return res.end(await readFile(resolve(HERE, file)));
      }
      if (req.method === 'GET' && path === '/catalog') return json([...new Map(dataset.map(i => [i.groundTruth.id, i.groundTruth])).values()]);
      if (req.method === 'GET' && path === '/references') return json(references.map(r => ({ ...r,
        images: r.images.map(({ path, file, ...image }) => image) })));
      if (req.method === 'GET' && path.startsWith('/reference/')) {
        const photo = references.flatMap(r => r.images).find(p => p.url === path);
        if (!photo) return json({ error: 'Not found' }, 404);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Disposition', 'inline; filename="reference.jpg"');
        return res.end(await readFile(photo.path));
      }
      if (req.method === 'GET' && path.startsWith('/photo/')) {
        const match = /^\/photo\/([\w-]+)\/(\d+)$/.exec(path);
        if (!match || !active || match[1] !== active.id || !active.item.photos[Number(match[2])]) return json({ error: 'Not found' }, 404);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Disposition', 'inline; filename="view.jpg"');
        return res.end(await readFile(active.item.photos[Number(match[2])].path));
      }
      if (req.method === 'GET' && path === '/api/state') return json(publicState());
      if (req.method === 'GET' && path === '/api/summary') return json(summarize(records));
      if (req.method !== 'POST') return json({ error: 'Not found' }, 404);
      if (req.headers['content-type'] !== 'application/json') return json({ error: 'JSON required' }, 415);
      let body = '';
      for await (const chunk of req) { body += chunk; if (body.length > 20000) return json({ error: 'Request too large' }, 413); }
      const input = JSON.parse(body || '{}');
      if (path === '/api/start') {
        if (!active) {
          const remaining = dataset.filter(i => !completed(i));
          if (remaining.length) active = { id: randomUUID(), item: remaining[randomInt(remaining.length)], candidates: [...SPECIES], history: [] };
        }
        return json(publicState());
      }
      if (!active || input.validationId !== active.id || input.steps !== active.history.length) return json({ error: 'Assessment changed. Reload the page.' }, 409);
      if (path === '/api/answer') {
        const step = answerStep(active.candidates, active.history, input.answer);
        active.history.push(step); active.candidates = step.candidatesAfter;
        return json(publicState());
      }
      if (path === '/api/undo') {
        const previous = active.history.pop();
        if (previous) active.candidates = previous.candidatesBefore;
        return json(publicState());
      }
      if (path === '/api/finish') {
        const assessment = deriveAssessment(active.candidates, active.history);
        const truth = active.item.groundTruth.id;
        const record = { schemaVersion: 3, logicVersion: 'foliar-conservative-2', keySource: 'docs/BOTANICAL_KEY_PILOT.md', keySha256: keyHash,
          ...assessment,
          confirmationCharacters: confirmationEvidence(active.candidates, active.history),
          validationId: active.id, groundTruth: active.item.groundTruth, individualId: active.item.individualId,
          photographs: active.item.photos.map(({ path, ...photo }) => ({ ...photo, path: path.slice(ROOT.length + 1).replaceAll('\\', '/') })),
          questions: active.history, charactersUnobservable: active.history.filter(s => s.answer === 'unknown').map(s => s.questionId),
          finalKeyCandidates: active.candidates, finalPredictedCandidates: active.candidates,
          groundTruthRetainedThroughout: active.history.every(s => s.candidatesAfter.includes(truth)),
          groundTruthInFinalCandidates: active.candidates.includes(truth),
          finalIdentificationMatchedGroundTruth: assessment.finalOutcome === 'ambiguous' ? null : active.candidates[0] === truth,
          diagnosticSteps: active.history.length, notes: '', timestamp: new Date().toISOString() };
        await mkdir(resultsDir, { recursive: true });
        await writeFile(resolve(resultsDir, `${record.validationId}.json`), JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
        records.push(record); active = null;
        return json({ record, resultSummary: resultSummary(record, dataset.map(i => i.groundTruth)), summary: summarize(records) });
      }
      return json({ error: 'Not found' }, 404);
    } catch (e) { console.error(e); if (!res.headersSent) json({ error: 'Request could not be completed. Check the local server console.' }, 400); else res.end(); }
  });
  return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await createApp();
  server.listen(Number(process.env.PORT || 4317), '127.0.0.1', () => console.log(`Botanical validation: http://127.0.0.1:${server.address().port}`));
}
