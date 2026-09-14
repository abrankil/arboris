const el = id => document.getElementById(id);
let state, selectedView = 0;
async function api(path, body) {
  const response = await fetch(`/api/${path}`, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const value = await response.json();
  if (!response.ok) throw new Error('No pudimos guardar este paso. Inténtalo de nuevo; si el problema continúa, recarga la página.');
  return value;
}
async function perform(fn) {
  el('error').textContent = '';
  document.querySelectorAll('button').forEach(b => b.disabled = true);
  el('main').setAttribute('aria-busy', 'true');
  try { await fn(); } catch (e) { el('error').textContent = e.message; }
  finally {
    document.querySelectorAll('button').forEach(b => b.disabled = false);
    if (state && !state.done) el('undo').disabled = !state.history.length;
    el('main').setAttribute('aria-busy', 'false');
  }
}
function selectView(index) {
  selectedView = index;
  el('main-photo').src = state.photos[index];
  el('main-photo').alt = `Vista ${index + 1} de la planta`;
  el('view-label').textContent = `Vista ${index + 1} de ${state.photos.length}`;
  [...el('thumbnails').children].forEach((b, i) => b.setAttribute('aria-pressed', String(i === index)));
}
const headings = { margin: 'Observa el borde de las hojas', glands: 'Acércate a los pequeños dientes', venation: 'Sigue las líneas de la hoja', underside: 'Compara ambos lados de la hoja' };
function render(s, focus = false) {
  const changed = state?.validationId !== s.validationId;
  state = s;
  el('status').textContent = s.done ? `${s.assessed} de ${s.total} exploradas` : `Planta ${s.assessed + 1} de ${s.total}`;
  el('progress').max = s.total; el('progress').value = s.assessed;
  el('assessment').hidden = !!s.done;
  el('welcome').hidden = !s.done;
  el('research').hidden = !s.done;
  el('start').hidden = !s.done || s.assessed >= s.total;
  el('complete').hidden = !s.done || s.assessed < s.total;
  if (s.done) return;
  el('reveal').hidden = true;
  el('result').textContent = '';
  el('technical').open = false;
  if (changed) {
    el('thumbnails').replaceChildren(...s.photos.map((url, i) => {
      const button = document.createElement('button'); button.className = 'thumbnail';
      button.setAttribute('aria-label', `Ver fotografía ${i + 1}`);
      const img = document.createElement('img'); img.src = url; img.alt = ''; button.append(img);
      button.onclick = () => selectView(i); return button;
    }));
    el('thumbnails').hidden = s.photos.length < 2;
    selectView(0);
  }
  el('step-label').textContent = `${s.history.length} ${s.history.length === 1 ? 'detalle observado' : 'detalles observados'}`;
  el('question-title').textContent = s.question ? headings[s.question.id] ?? 'Observa este detalle' : 'Una mirada que nos ayuda a aprender';
  el('question').textContent = s.question?.prompt ?? 'Ya reunimos toda la evidencia visible en estas fotografías.';
  el('answers').replaceChildren(...(s.question?.options ?? []).map(o => {
    const b = document.createElement('button'); b.className = `answer${o.value === 'unknown' ? ' unknown' : ''}`;
    b.textContent = o.value === 'unknown' ? 'No logro verlo' : s.question.id === 'margin' ? (o.value === 'entire' ? 'Entero u ondulado' : 'Con dientes') : o.label;
    b.onclick = () => perform(async () => render(await api('answer', { ...context(), answer: o.value }), true));
    return b;
  }));
  el('evidence-message').textContent = s.question ? (s.history.length ? 'Ya tenemos más información. Sigamos observando.' : 'Si no puedes distinguirlo, elige «No logro verlo».') : 'No es necesario adivinar. Descubramos qué planta es.';
  el('finish-hint').textContent = s.question ? 'Puedes descubrirla ahora. Guardaremos el recorrido con evidencia incompleta.' : 'Tu recorrido se guardará al descubrir la especie.';
  el('undo').hidden = !s.history.length;
  el('undo').disabled = !s.history.length;
  el('question-content').classList.remove('question-enter');
  void el('question-content').offsetWidth;
  el('question-content').classList.add('question-enter');
  if (focus) el('question-title').focus({ preventScroll: true });
}
const context = () => ({ validationId: state.validationId, steps: state.history.length });
el('start').onclick = () => perform(async () => render(await api('start', {}), true));
el('undo').onclick = () => perform(async () => render(await api('undo', context()), true));
el('enlarge').onclick = () => {
  el('expanded-photo').src = state.photos[selectedView];
  el('original-photo').href = state.photos[selectedView];
  el('photo-dialog').showModal();
};
el('close-photo').onclick = () => el('photo-dialog').close();
el('finish').onclick = () => perform(async () => {
  const value = await api('finish', context());
  // Use the successful save response without a second fallible request.
  render({ done: true, assessed: value.summary.individualsAssessed, total: state.total });
  el('welcome').hidden = true;
  el('main-photo').removeAttribute('src'); el('thumbnails').replaceChildren();
  el('reveal').hidden = false;
  const r = value.resultSummary;
  el('common-name').textContent = r.commonName;
  el('scientific-name').textContent = r.scientificName;
  el('consistency').textContent = r.consistency;
  el('explanation').textContent = r.explanation;
  el('evidence-explanation').textContent = r.evidenceExplanation;
  el('reveal').classList.toggle('is-inconsistent', !r.survived);
  el('predictions').replaceChildren(...(r.predictions.length ? r.predictions : ['Ninguna candidata compatible']).map(name => {
    const li = document.createElement('li'); li.textContent = name; return li;
  }));
  el('technical-steps').textContent = `${r.diagnosticSteps} pasos diagnósticos. ${r.elimination ? `Eliminación en el paso ${r.elimination.step}: ${r.elimination.question} Respuesta: ${r.elimination.answer}` : 'La referencia no fue eliminada.'}`;
  el('technical').open = false;
  el('result').textContent = JSON.stringify(value.record, null, 2);
  el('summary').textContent = JSON.stringify(value.summary, null, 2);
  el('start').textContent = 'Explorar otra planta →';
  el('common-name').focus();
});
perform(async () => { render(await api('state')); el('summary').textContent = JSON.stringify(await api('summary'), null, 2); });
