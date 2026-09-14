import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { runInNewContext } from 'node:vm';
import * as domain from './observation.mjs';
import { createApp, loadDataset } from './server.mjs';
import { referenceLibrary, REPRESENTATIVES } from './references.mjs';
const { createObservation, recordAnswer, addPhoto, additionalPhotoRequest, identify, trace, imageType, nextQuestion } = domain;
const photo = { id: 'photo', type: 'image/jpeg', size: 100, url: 'blob:local' };

test('uploaded observation uses existing adaptive key and preserves unknown evidence on another view', () => {
  const o = createObservation('local'); addPhoto(o, photo);
  assert.equal(nextQuestion(o.candidates, o.history).id, 'margin');
  assert.equal(additionalPhotoRequest(o), null, 'No unsolicited extra photo');
  recordAnswer(o, 'unknown'); assert.equal(o.candidates.length, 6);
  const request = additionalPhotoRequest(o); assert.equal(request.questionId, 'margin');
  addPhoto(o, { ...photo, id: 'second' }, request);
  assert.equal(o.photos.length, 2); assert.equal(nextQuestion(o.candidates, o.history).id, 'margin');
  assert.ok(o.events.some(e => e.type === 'answer' && e.answer === 'unknown'));
  for (const answer of ['entire', 'no', 'yes']) recordAnswer(o, answer);
  assert.equal(identify(o).status, 'supported');
  assert.deepEqual(o.hypothesis.candidates, ['SP001']);
  assert.equal(additionalPhotoRequest(o), null);
  assert.ok(!JSON.stringify(trace(o)).includes('blob:'));
});
test('ambiguous, singleton without confirmation, and none-of-six remain cautious hypotheses', () => {
  const o = createObservation('unknown'); addPhoto(o, photo);
  while (nextQuestion(o.candidates, o.history)) recordAnswer(o, 'unknown');
  assert.equal(identify(o).status, 'ambiguous');
  assert.equal(o.hypothesis.evidence.length, 0);
  assert.equal(o.hypothesis.endedEarly, false);
  assert.equal(additionalPhotoRequest(o).questionId, 'margin');
  o.candidates = ['SP001']; assert.equal(identify(o).status, 'ambiguous');
  // Defensive zero-candidate case; no invented elimination rule is added to the key.
  o.candidates = []; const h = identify(o);
  assert.equal(h.status, 'none'); assert.equal(h.evidenceStatus, 'contradictory');
  assert.equal(additionalPhotoRequest(o), null);
  assert.equal(identify(createObservation('early')).endedEarly, true);
});
test('JPG/JPEG, PNG and WEBP checked by content, never species-bearing filenames', async () => {
  for (const [bytes, type] of [ [[255,216,255,0], 'image/jpeg'], [[137,80,78,71,13,10,26,10], 'image/png'], [[82,73,70,70,0,0,0,0,87,69,66,80], 'image/webp'] ]) {
    const file = new Blob([new Uint8Array(bytes)]);
    Object.defineProperty(file, 'name', { get() { throw new Error('Filename must not be read'); } });
    assert.equal(await imageType(file), type);
  }
  await assert.rejects(imageType(new Blob(['not an image'])), /JPG/);
  await assert.rejects(imageType(new Blob([])), /20 MB/);
});
test('root is upload-only, validation preserved, and catalog has no individual/photo metadata', async () => {
  const resultsDir = await mkdtemp(join(tmpdir(), 'arboris-routes-'));
  const server = await createApp({ resultsDir });
  try {
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    const root = await (await fetch(base)).text();
    assert.match(root, /¿Qué planta encontraste\?/); assert.match(root, /type="file"/);
    assert.match(root, /\.jpg,\.jpeg,\.png,\.webp/);
    for (const banned of ['validationId', 'groundTruth', 'individuo', 'JSON', '/photo/', 'SP001', 'LC002']) assert.ok(!root.includes(banned));
    const internal = await (await fetch(base + '/validation')).text();
    assert.match(internal, /validation.js/); assert.match(internal, /id="technical"/);
    const catalog = await (await fetch(base + '/catalog')).json();
    assert.equal(catalog.length, 6);
    assert.deepEqual(Object.keys(catalog[0]).sort(), ['commonName', 'id', 'scientificName']);
    for (const asset of ['/app.js','/observation.mjs','/logic.mjs','/validation.js']) assert.equal((await fetch(base+asset)).status, 200);
    assert.equal((await fetch(base + '/data/species/SP001_cryptocarya_alba.json')).status, 404);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(resultsDir, { recursive: true, force: true }); }
});
test('main UI uploads locally, adds optional view, and displays human-assisted result', async () => {
  const html = await readFile(new URL('./public/index.html', import.meta.url), 'utf8');
  const elements = new Map(), requests = [], storage = new Map();
  function node() { return { children: [], attrs: {}, textContent: '', hidden:false, files:[],
    classList:{ add(){}, remove(){} }, setAttribute(k,v){this.attrs[k]=v;},
    append(c){this.children.push(c);}, replaceChildren(...c){this.children=c;}, focus(){}, click(){this.clicked=true;}, showModal(){this.open=true;}, close(){this.open=false;} }; }
  for (const [,id] of html.matchAll(/id="([^"]+)"/g)) elements.set(id,node());
  const get=id=>{assert.ok(elements.has(id),id);return elements.get(id);};
  const catalog = [...new Map((await loadDataset()).map(i=>[i.groundTruth.id,i.groundTruth])).values()];
  const library = referenceLibrary(await loadDataset());
  const source=(await readFile(new URL('./public/app.js',import.meta.url),'utf8')).replace(/^\s*import .*?;\s*/, '');
  runInNewContext(source, { ...domain,
    document:{ getElementById:get, createElement:node, querySelectorAll:()=>[...elements.values()] },
    fetch:async(url)=>{requests.push(url);return {ok:true,json:async()=>url === '/references' ? library : catalog};},
    Image:class { async decode(){} }, URL:{createObjectURL:()=> 'blob:local',revokeObjectURL(){}},
    crypto:{randomUUID:()=>String(Math.random())}, sessionStorage:{setItem:(k,v)=>storage.set(k,v)},
    window:{addEventListener(){}},
  });
  get('upload').onclick(); assert.equal(get('photo-input').clicked,true);
  get('photo-input').files=[new Blob([new Uint8Array([255,216,255,0])])];
  await get('photo-input').onchange();
  assert.equal(get('observation').hidden,false); assert.equal(get('main-photo').src,'blob:local');
  get('answers').children.at(-1).onclick(); assert.equal(get('additional').hidden,false);
  get('add-photo').onclick(); await get('photo-input').onchange();
  assert.equal(get('thumbnails').children.length,2);
  for(const index of [0,1,0]) get('answers').children[index].onclick();
  await get('finish').onclick();
  assert.equal(get('result-title').textContent,'Peumo');
  assert.equal(get('scientific-name').textContent,'Cryptocarya alba');
  assert.deepEqual(requests,['/catalog'], 'No images or evidence sent to server');
  assert.equal(storage.size,1); assert.ok(![...storage.values()][0].includes('blob:'));
  get('new-photo').onclick(); await get('photo-input').onchange();
  assert.equal(get('thumbnails').children.length,1);
  assert.equal(get('question-title').textContent,'Observa el borde de la hoja');
  for (const index of [0,1,2]) get('answers').children[index].onclick();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(get('comparison').hidden,false);
  assert.equal(get('comparison-user').src,'blob:local');
  assert.equal(get('reference-cards').children.length,2);
  assert.ok(!get('reference-cards').children[0].children[1].textContent.includes('Cryptocarya'));
  get('choose-a').onclick(); await new Promise(resolve=>setImmediate(resolve));
  assert.match(get('result-caution').textContent,/aporta apoyo a Peumo/);
  assert.equal(get('result-card').hidden,false);
});
test('comparison requires exactly two candidates, no unanswered useful question, and no contradiction', () => {
  const o = createObservation('comparison'); addPhoto(o,photo);
  assert.equal(domain.shouldCompare(o),false);
  recordAnswer(o,'entire'); recordAnswer(o,'no');
  assert.equal(o.candidates.length,2); assert.equal(domain.shouldCompare(o),false);
  recordAnswer(o,'unknown'); assert.equal(domain.shouldCompare(o),true);
  o.candidates=['SP001']; assert.equal(domain.shouldCompare(o),false);
  o.candidates=['SP001','SP006']; o.history.push({candidatesAfter:[]});
  assert.equal(domain.shouldCompare(o),false);
});
test('A, B and none add traceable visual evidence without overriding botanical candidates', async () => {
  const library=referenceLibrary(await loadDataset());
  for(const choice of ['A','B','none']) {
    const o=createObservation(choice); addPhoto(o,photo);
    for(const answer of ['entire','no','unknown']) recordAnswer(o,answer);
    const refs=o.candidates.map(id=>library.find(r=>r.speciesId===id));
    domain.recordComparison(o,refs,choice);
    const h=identify(o);
    assert.equal(h.status,'ambiguous'); assert.deepEqual(o.candidates,['SP001','SP006']);
    assert.equal(h.comparisonNone,choice==='none');
    if(choice!=='none') assert.equal(h.visualSupport[choice==='A'?'SP001':'SP006'],1);
    assert.equal(trace(o).comparison.references.length,2);
    assert.deepEqual(trace(o).comparison.candidatesBefore,trace(o).comparison.candidatesAfter);
    // Even stale visual evidence cannot revive a now excluded species.
    o.candidates=['SP002']; assert.equal(identify(o).preferredCandidate,null);
    assert.throws(()=>domain.recordComparison(o,refs,choice));
  }
});
test('deterministic reviewed references resolve to correct species metadata and image bytes', async () => {
  const dataset=await loadDataset(), refs=referenceLibrary(dataset);
  assert.equal(refs.length,6); assert.deepEqual(refs,referenceLibrary([...dataset].reverse()));
  for(const r of refs) {
    assert.equal(r.images.length,1);
    assert.equal(r.images[0].file,REPRESENTATIVES[r.speciesId]);
    assert.ok(dataset.some(i=>i.groundTruth.id===r.speciesId && i.photos.some(p=>p.path===r.images[0].path)));
  }
  const resultsDir=await mkdtemp(join(tmpdir(),'arboris-references-'));
  const server=await createApp({resultsDir});
  try {
    server.listen(0,'127.0.0.1');await once(server,'listening');
    const base=`http://127.0.0.1:${server.address().port}`;
    const publicRefs=await (await fetch(base+'/references')).json();
    assert.ok(!JSON.stringify(publicRefs).includes('C:\\'));
    for(const r of refs) {
      const response=await fetch(base+r.images[0].url);
      assert.equal(response.status,200);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()),await readFile(r.images[0].path));
    }
  } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await rm(resultsDir,{recursive:true,force:true});}
});
test('historical LC002 remains byte-for-byte intact and dataset still has 15 plants/45 photographs', async () => {
  const file = await readFile(new URL('./results/0670001f-43c0-475b-8f6a-73ae4502174e.json', import.meta.url));
  assert.equal(createHash('sha256').update(file).digest('hex'), '5c35da4e54c01cef55480fc84010b0b17a4381c87dd15d803ac510620c90d06b');
  const dataset = await loadDataset(); assert.equal(dataset.length,15);
  assert.equal(dataset.reduce((n,i)=>n+i.photos.length,0),45);
});
