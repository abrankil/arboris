import { createObservation, recordAnswer, undoAnswer, addPhoto, additionalPhotoRequest, identify, trace, imageType, nextQuestion, shouldCompare, recordComparison } from '/observation.mjs';

const el = id => document.getElementById(id);
let observation = null, catalog = [], selected = 0, uploadMode = 'replace', busy = false;
let comparisonReferences = [];
const headings = { margin: 'Observa el borde de la hoja', glands: 'Acércate a los pequeños dientes', venation: 'Sigue las líneas de la hoja', underside: 'Compara ambos lados de la hoja' };
const evidenceNames = { margin: 'Margen', glands: 'Glándulas en los dientes', venation: 'Nervaduras', underside: 'Contraste entre haz y envés' };
const catalogReady = fetch('/catalog').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => { catalog = data; }).catch(() => {
  el('error').textContent = 'No pudimos cargar la guía botánica. Recarga la página para intentarlo de nuevo.';
});
function selectPhoto(index) {
  selected = index;
  el('main-photo').src = observation.photos[index].url;
  el('view-label').textContent = `Vista ${index + 1} de ${observation.photos.length}`;
  [...el('thumbnails').children].forEach((b,i) => b.setAttribute('aria-pressed', String(i === index)));
}
function gallery() {
  el('thumbnails').replaceChildren(...observation.photos.map((photo,i) => {
    const b = document.createElement('button'); b.className = 'thumbnail'; b.setAttribute('aria-label', `Ver fotografía ${i+1}`);
    const img = document.createElement('img'); img.src = photo.url; img.alt = ''; b.append(img); b.onclick = () => selectPhoto(i); return b;
  }));
  el('thumbnails').hidden = observation.photos.length === 1;
  selectPhoto(Math.min(selected, observation.photos.length - 1));
}
function render(focus = false) {
  el('comparison').hidden = true;
  el('welcome').hidden = !!observation;
  el('observation').hidden = !observation;
  el('result-card').hidden = true;
  if (!observation) return;
  const q = nextQuestion(observation.candidates, observation.history);
  el('question-title').textContent = q ? headings[q.id] : 'Ya observamos los detalles disponibles';
  el('question').textContent = q?.prompt ?? 'Podemos conocer lo que sugiere la evidencia, aunque aún queden dudas.';
  el('answers').replaceChildren(...(q?.options ?? []).map(o => {
    const b = document.createElement('button'); b.className = `answer${o.value === 'unknown' ? ' unknown' : ''}`;
    b.textContent = o.value === 'unknown' ? 'No logro verlo' : q.id === 'margin' ? (o.value === 'entire' ? 'Entero u ondulado' : 'Con dientes') : o.label;
    b.onclick = () => { recordAnswer(observation, o.value); render(true); }; return b;
  }));
  el('undo').hidden = !observation.history.length;
  el('step-message').textContent = observation.history.length ? 'Ya tenemos más información.' : 'Si el detalle no se ve, no hace falta adivinar.';
  showRequest();
  el('question-content').classList.remove('question-enter'); void el('question-content').offsetWidth; el('question-content').classList.add('question-enter');
  if (focus) el('question-title').focus({ preventScroll: true });
  if (shouldCompare(observation) && !observation.comparison) void showComparison();
}
async function showComparison() {
  const current = observation, history = JSON.stringify(observation.history);
  try {
    const response = await fetch('/references');
    if (!response.ok) throw new Error();
    const library = await response.json();
    if (observation !== current || JSON.stringify(observation.history) !== history || !shouldCompare(observation)) return;
    comparisonReferences = observation.candidates.map(id => library.find(r => r.speciesId === id));
    if (comparisonReferences.some(r => !r?.images?.length)) throw new Error();
    comparisonReferences = comparisonReferences.map(r => ({...r, images:r.images.slice(0,1)}));
    el('comparison-user').src = observation.photos[selected].url;
    el('reference-cards').replaceChildren(...comparisonReferences.map((r,i) => {
      const card = document.createElement('article'), link = document.createElement('a'), img = document.createElement('img'), title = document.createElement('h3');
      link.href = r.images[0].url; link.target = '_blank'; link.rel = 'noopener';
      link.setAttribute('aria-label', `Ampliar referencia ${i === 0 ? 'A' : 'B'}`);
      img.src = r.images[0].url; img.alt = `Hojas de la opción ${i === 0 ? 'A' : 'B'}`;
      title.textContent = `Opción ${i === 0 ? 'A' : 'B'} · ${r.commonName}`;
      link.append(img); card.append(link); card.append(title); return card;
    }));
    el('observation').hidden = true; el('result-card').hidden = true; el('additional').hidden = true;
    el('comparison').hidden = false; el('comparison-title').focus();
  } catch { el('error').textContent = 'No pudimos cargar las referencias. Puedes continuar sin comparar.'; }
}
for (const [id,choice] of [['choose-a','A'],['choose-b','B'],['choose-none','none']]) {
  el(id).onclick = () => { recordComparison(observation, comparisonReferences, choice); void showResult(); };
}
el('skip-comparison').onclick = () => { void showResult(); };
function showRequest() {
  const request = additionalPhotoRequest(observation);
  el('additional').hidden = !request;
  el('photo-request').textContent = request?.message ?? '';
}
function choose(mode) { uploadMode = mode; el('photo-input').value = ''; el('photo-input').click(); }
el('upload').onclick = el('replace').onclick = el('new-photo').onclick = () => choose('replace');
el('add-photo').onclick = () => choose('add');
el('photo-input').onchange = async () => {
  const file = el('photo-input').files[0];
  if (!file || busy) return;
  busy = true; el('error').textContent = '';
  document.querySelectorAll('button').forEach(b => b.disabled = true);
  let url;
  try {
    const type = await imageType(file);
    url = URL.createObjectURL(file);
    const probe = new Image(); probe.src = url; await probe.decode();
    if (uploadMode === 'replace' || !observation) {
      for (const p of observation?.photos ?? []) URL.revokeObjectURL(p.url);
      observation = createObservation(crypto.randomUUID()); selected = 0;
    }
    const request = uploadMode === 'add' ? additionalPhotoRequest(observation) : null;
    addPhoto(observation, { id: crypto.randomUUID(), url, type, size: file.size }, request);
    gallery(); render(true);
  } catch (error) {
    if (url) URL.revokeObjectURL(url);
    el('error').textContent = error.message.startsWith('Elige') ? error.message : 'No pudimos abrir esa fotografía. Prueba con otra imagen.';
  } finally { busy = false; document.querySelectorAll('button').forEach(b => b.disabled = false); }
};
el('undo').onclick = () => { undoAnswer(observation); render(true); };
el('enlarge').onclick = () => { el('expanded-photo').src = observation.photos[selected].url; el('original-photo').href = observation.photos[selected].url; el('photo-dialog').showModal(); };
el('close-photo').onclick = () => el('photo-dialog').close();
el('continue').onclick = () => render(true);
el('finish').onclick = async () => {
  if (shouldCompare(observation) && !observation.comparison) {
    await showComparison();
    if (!el('comparison').hidden) return;
  }
  await showResult();
};
async function showResult() {
  await catalogReady;
  if (!catalog.length) return;
  const hypothesis = identify(observation);
  // Session-local technical trace only: never filenames, file paths, or image bytes.
  try { sessionStorage.setItem(`arboris-observation-${observation.id}`, JSON.stringify(trace(observation))); }
  catch { /* In-memory observation still retains full trace when storage is unavailable. */ }
  const species = catalog.filter(s => hypothesis.candidates.includes(s.id));
  const supported = hypothesis.status === 'supported';
  el('comparison').hidden = true;
  el('result-title').textContent = supported ? species[0].commonName : hypothesis.status === 'none' ? 'Sigamos explorando' : 'Aún hay más por observar';
  el('scientific-name').textContent = supported ? species[0].scientificName : '';
  el('result-message').textContent = supported ? 'Las características que observaste son compatibles con esta especie.'
    : hypothesis.status === 'none' ? 'Esta planta no parece ser una de las seis especies que Árboris reconoce por ahora.'
    : species.length === 1 ? 'Queda una especie posible, pero todavía falta evidencia independiente para sostener la identificación.'
    : 'Todavía no tenemos suficiente evidencia para distinguir entre estas especies.';
  el('result-caution').textContent = hypothesis.status === 'none' ? 'Las respuestas también pueden ser contradictorias o insuficientes. Puedes revisarlas; este resultado no es definitivo.'
    : hypothesis.endedEarly ? 'Aún quedan detalles útiles por observar. Puedes retomar las preguntas.' : '';
  if (hypothesis.comparisonNone) {
    el('result-message').textContent = 'Esta planta no parece coincidir claramente con ninguna de estas dos opciones.';
    el('result-caution').textContent = 'El parecido visual no descarta por sí solo las candidatas botánicas. La identificación sigue sin resolverse.';
  } else if (hypothesis.preferredCandidate) {
    const preferred = catalog.find(s => s.id === hypothesis.preferredCandidate);
    el('result-caution').textContent = `El parecido visual aporta apoyo a ${preferred.commonName}, pero no confirma la identificación ni descarta la otra opción.`;
  }
  el('species-options').replaceChildren(...(supported ? [] : species).map(s => {
    const li = document.createElement('li'); li.textContent = `${s.commonName} · ${s.scientificName}`; return li;
  }));
  el('evidence').replaceChildren(...(hypothesis.evidence.length ? hypothesis.evidence.map(e => `${evidenceNames[e.character]}: ${e.label}`) : ['Aún no hay caracteres visibles confirmados.']).map(label => {
    const li = document.createElement('li'); li.textContent = label; return li;
  }));
  el('observation').hidden = true; el('result-card').hidden = false; showRequest(); el('result-title').focus();
}
window.addEventListener('pagehide', event => {
  if (!event.persisted) for (const photo of observation?.photos ?? []) URL.revokeObjectURL(photo.url);
});

