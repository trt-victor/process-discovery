import { MODES, SECTIONS, KINDS, CONTEXT } from './content.js';
import * as L from './logic.js';

const KEY = 'discovery-v1';
let D = L.blank(), CFG = { reimagine: '' }, playing = null;
try { D = { ...D, ...JSON.parse(localStorage.getItem(KEY)) }; } catch { /* corrupt or unavailable storage: start fresh */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch { /* private mode */ } };
const uid = () => Math.random().toString(36).slice(2, 8);

// Tiny DOM builder; text always goes in as text nodes, never as HTML.
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k in el && k !== 'list') el[k] = v;
    else el.setAttribute(k, v);
  }
  el.append(...kids.flat(Infinity).filter((x) => x != null && x !== false));
  return el;
}
const $ = (id) => document.getElementById(id);
const fill = (el, ...kids) => el.replaceChildren(...kids.flat(Infinity).filter((x) => x != null && x !== false));
const own = () => D.steps.length >= 2; // the client has described their own process
const shown = () => (own() ? D.steps : L.exampleSteps());
function go(view) { clearInterval(playing); playing = null; D.view = view; save(); render(); scrollTo(0, 0); }

/* ---------- the picture ---------- */
// Blocks are kept between redraws and only moved, so switching picture animates them from one place to the next.
const ROW = [0, 74, 190], HEIGHT = [62, 104, 44];
function canvas() {
  const el = h('div', { class: 'canvas', role: 'img' }), blocks = new Map();
  return { el, draw(steps, mode, marks = false) {
    const next = L.layout(steps, mode), seen = new Set();
    el.dataset.mode = mode;
    el.setAttribute('aria-label', `${MODES.find((m) => m.id === mode).title}: ${next.filter((b) => !b.hidden && b.row === 1).map((b) => b.text).join(', then ')}`);
    for (const b of next) {
      seen.add(b.key);
      let d = blocks.get(b.key);
      if (!d) { d = h('div', { class: 'blk' }, h('b'), h('span'), h('i')); d.style.opacity = 0; blocks.set(b.key, d); el.append(d); void d.offsetWidth; }
      const s = steps.find((x) => x.id === b.key);
      d.className = 'blk ' + b.cls;
      d.children[0].textContent = b.text; d.children[1].textContent = b.sub || '';
      d.children[2].textContent = marks && s?.friction.length ? '⚡ ' + s.friction.length : '';
      Object.assign(d.style, { left: b.left + '%', width: b.width + '%', top: ROW[b.row] + 'px', height: HEIGHT[b.row] + 'px', opacity: b.hidden ? 0 : 1 });
    }
    for (const [k, d] of blocks) if (!seen.has(k)) { d.remove(); blocks.delete(k); }
  } };
}

/* ---------- 1. what reimagination is ---------- */
function renderIntro() {
  const C = canvas(), text = h('div', { class: 'explain' }), tabs = h('div', { class: 'modes', role: 'tablist' });
  const set = (id) => { D.mode = id; save(); draw(); };
  const draw = () => {
    const m = MODES.find((x) => x.id === D.mode) || MODES[0], n = L.counts(shown(), m.id);
    fill(tabs, MODES.map((x, i) => h('button', { role: 'tab', 'aria-selected': String(x.id === m.id), class: x.id === m.id ? 'on' : '', onclick: () => { clearInterval(playing); playing = null; set(x.id); } }, `${i + 1}. ${x.name}`)),
      h('button', { class: 'add', onclick: () => { clearInterval(playing); if (playing) { playing = null; return draw(); } set(MODES[0].id); playing = setInterval(() => { const i = MODES.findIndex((x) => x.id === D.mode); if (i === MODES.length - 1) { clearInterval(playing); playing = null; return draw(); } set(MODES[i + 1].id); }, 4200); draw(); } }, playing ? '⏸ Pause' : '▶ Play all three'));
    C.draw(shown(), m.id);
    fill(text, h('h2', {}, m.title), h('p', { class: 'lead' }, m.text),
      h('div', { class: 'kpis' }, [['steps', 'steps'], ['handovers', 'hand-overs between people'], ['people', 'steps done by a person']].map(([k, l]) => h('div', { class: 'kpi' }, h('b', {}, String(n[k])), l))),
      h('div', { class: 'blob' }, h('b', {}, 'To discuss'), h('ul', {}, m.talk.map((q) => h('li', {}, q)))));
  };
  draw();
  fill($('app'), h('div', { class: 'setup glass wide' },
    h('div', { class: 'brand' }, 'EY.ai Lab · AI Leap · Blueprint Studio'),
    h('h1', {}, 'What does it mean to reimagine a process?'),
    h('p', { class: 'lead' }, 'Most organisations start by adding AI to the process they already have. Reimagining means asking what the process would look like if it were designed today, with AI as part of it from the start. Three pictures show the difference.'),
    tabs,
    h('p', { class: 'hint' }, own() ? `This is your process: ${L.title(D)}. The reimagined picture is an illustration built from your answers, not a design.` : 'An example process. Describe your own and these pictures are redrawn with your steps.'),
    C.el, text,
    h('div', { class: 'bar' }, h('button', { class: 'primary big', onclick: () => go('interview') }, own() || L.answered(D) ? 'Continue with your process →' : 'Now your process →'),
      L.answered(D) > 0 && h('button', { class: 'add', onclick: () => go('summary') }, 'See the current state'))));
}

/* ---------- 2. the interview ---------- */
const stepInput = (s, attrs) => h('input', { value: s.name, 'aria-label': 'Step name', ...attrs });
const INPUT = {
  short: (q) => h('input', { class: 'ans', placeholder: q.ph || '', value: D.a[q.id] || '', 'aria-label': q.q, oninput: (e) => { D.a[q.id] = e.target.value; save(); side(); } }),
  text: (q) => h('textarea', { class: 'ans', rows: 5, placeholder: q.ph || 'In their words…', value: D.a[q.id] || '', 'aria-label': q.q, oninput: (e) => { D.a[q.id] = e.target.value; save(); side(); } }),
  steps: () => {
    const box = h('div', { class: 'steplist' });
    const add = (name = '') => { D.steps.push({ id: uid(), name, kind: '', who: '', friction: [] }); save(); draw(); box.querySelector('li:last-child input')?.focus(); };
    const draw = () => { fill(box, h('ol', {}, D.steps.map((s, i) => h('li', {}, stepInput(s, { placeholder: 'What happens in this step?', oninput: (e) => { s.name = e.target.value; save(); side(); }, onkeydown: (e) => { if (e.key === 'Enter' && s.name.trim()) add(); } }),
      h('button', { class: 'x', title: 'Move earlier', 'aria-label': 'Move step earlier', disabled: i === 0, onclick: () => { D.steps.splice(i - 1, 0, D.steps.splice(i, 1)[0]); save(); draw(); } }, '↑'),
      h('button', { class: 'x', 'aria-label': 'Remove step', onclick: () => { D.steps.splice(i, 1); save(); draw(); } }, '×')))),
      h('button', { class: 'add', onclick: () => add() }, '+ step')); side(); };
    draw();
    return box;
  },
  who: () => h('div', { class: 'perstep' }, D.steps.map((s) => h('label', {}, h('b', {}, s.name || 'Step'), h('input', { placeholder: 'Role or team', value: s.who, oninput: (e) => { s.who = e.target.value; save(); side(); } })))),
  kind: () => h('div', { class: 'perstep' }, D.steps.map((s) => { const box = h('div', { class: 'who' }); const draw = () => fill(box, KINDS.map(([v, l]) => h('button', { class: s.kind === v ? 'on' : '', 'aria-pressed': String(s.kind === v), onclick: () => { s.kind = s.kind === v ? '' : v; save(); draw(); side(); } }, l))); draw(); return h('div', { class: 'row' }, h('b', {}, s.name || 'Step'), box); })),
  friction: () => h('div', { class: 'perstep' }, D.steps.map((s) => {
    const list = h('div', { class: 'chips' }), input = h('input', { placeholder: 'What goes wrong or takes too long here? Enter to add', 'aria-label': 'Friction at ' + s.name, onkeydown: (e) => { if (e.key === 'Enter' && input.value.trim()) { s.friction.push(input.value.trim()); input.value = ''; save(); draw(); side(); } } });
    const draw = () => fill(list, s.friction.map((f, i) => h('span', { class: 'fchip' }, f, h('button', { class: 'x', 'aria-label': 'Remove', onclick: () => { s.friction.splice(i, 1); save(); draw(); side(); } }, '×'))));
    draw();
    return h('div', { class: 'row' }, h('b', {}, s.name || 'Step'), list, input);
  })),
};
let side = () => {};
function renderInterview() {
  D.at = Math.min(Math.max(0, D.at), L.QUESTIONS.length - 1);
  const q = L.QUESTIONS[D.at], needSteps = ['who', 'kind', 'friction'].includes(q.type) && !D.steps.length;
  const C = canvas(), nav = h('div', { class: 'secnav' }), board = h('div');
  const move = (d) => { const i = D.at + d; if (i >= L.QUESTIONS.length) return go('summary'); D.at = Math.max(0, i); save(); render(); scrollTo(0, 0); };
  side = () => {
    fill(board, D.steps.length ? [h('b', {}, L.title(D)), C.el] : h('p', { class: 'hint' }, 'Your process appears here as you describe it.'));
    if (D.steps.length) C.draw(D.steps, 'today', true);
    fill(nav, SECTIONS.map((s) => { const start = L.QUESTIONS.findIndex((x) => x.section === s), done = s.questions.filter((x) => !L.open(D).some((o) => o.id === x.id)).length;
      return h('button', { class: 'sec' + (s === q.section ? ' on' : ''), onclick: () => { D.at = start; save(); render(); } }, h('span', {}, s.title), h('small', {}, `${done}/${s.questions.length}`)); }));
  };
  fill($('app'),
    h('header', { class: 'top' },
      h('div', { class: 'ttl' }, h('div', { class: 'brand' }, 'EY.ai Lab · Blueprint Studio'), h('div', { class: 'prog', role: 'progressbar', 'aria-valuenow': D.at + 1, 'aria-valuemax': L.QUESTIONS.length }, h('i', { style: `width:${(100 * (D.at + 1)) / L.QUESTIONS.length}%` })), h('span', { class: 'round' }, `Question ${D.at + 1} of ${L.QUESTIONS.length}`), h('h1', {}, q.section.title)),
      h('div', { class: 'obj' }, h('b', {}, 'Understanding today'), h('p', {}, q.section.intro)),
      h('div', { class: 'tools' }, h('button', { onclick: () => go('intro') }, 'The three pictures'), h('button', { onclick: () => go('summary') }, 'Current state'),
        h('button', { 'aria-pressed': String(D.notes), class: D.notes ? 'on' : '', title: 'Show what to listen for', onclick: () => { D.notes = !D.notes; save(); render(); } }, 'Interviewer notes'))),
    h('div', { class: 'ilayout' },
      h('aside', { class: 'glass ipanel' }, board, nav),
      h('main', { class: 'glass qcard' },
        h('h2', {}, q.q), h('p', { class: 'why' }, q.why),
        D.notes && q.listen && h('div', { class: 'blob' }, h('b', {}, 'Listen for'), h('p', {}, q.listen)),
        needSteps ? h('p', { class: 'hint' }, 'Add the steps of the process first.', h('button', { class: 'aibtn', onclick: () => { D.at = L.QUESTIONS.findIndex((x) => x.type === 'steps'); save(); render(); } }, 'Go to the steps')) : INPUT[q.type](q),
        h('div', { class: 'bar nav' }, D.at > 0 && h('button', { class: 'add', onclick: () => move(-1) }, '← Back'),
          h('button', { class: 'primary', onclick: () => move(1) }, D.at === L.QUESTIONS.length - 1 ? 'See the current state →' : 'Next →'),
          h('span', { class: 'hint' }, 'Not sure? Leave it open: it goes on the list for next time.')))));
  side();
  document.querySelector('.qcard .ans, .qcard input')?.focus();
}

/* ---------- 3. the current state ---------- */
function renderSummary() {
  const C = canvas(), tabs = h('div', { class: 'modes' }), openQ = L.open(D);
  const draw = (id) => { fill(tabs, MODES.map((m, i) => h('button', { class: m.id === id ? 'on' : '', 'aria-pressed': String(m.id === id), onclick: () => draw(m.id) }, `${i + 1}. ${m.name}`))); C.draw(D.steps, id, id === 'today'); };
  const dl = () => { const a = h('a', { href: URL.createObjectURL(new Blob([L.summaryMd(D)], { type: 'text/markdown' })), download: 'current-state.md' }); a.click(); URL.revokeObjectURL(a.href); };
  const extra = SECTIONS.map((s) => [s, s.questions.filter((q) => ['text', 'short'].includes(q.type) && q.id !== 'name' && !CONTEXT.some((c) => c[1] === q.id) && (D.a[q.id] || '').trim())]).filter(([, l]) => l.length);
  fill($('app'),
    h('header', { class: 'top' },
      h('div', { class: 'ttl' }, h('div', { class: 'brand' }, 'EY.ai Lab · Blueprint Studio'), h('span', { class: 'round' }, 'Current state'), h('h1', {}, L.title(D))),
      h('div', { class: 'obj' }, h('b', {}, 'Where we are'), h('p', {}, `${L.answered(D)} of ${L.QUESTIONS.length} questions answered. This is the shared picture of the process today, and the starting point for the reimagination session.`)),
      h('div', { class: 'tools' }, h('button', { onclick: () => go('intro') }, 'The three pictures'), h('button', { onclick: () => go('interview') }, 'Back to the interview'))),
    h('div', { class: 'desk' },
      own() ? h('section', { class: 'glass board' }, h('h3', {}, 'Process overview and friction'), tabs, C.el, h('p', { class: 'hint' }, 'The reimagined picture is an illustration from your answers on judgement and legwork. The real design is made together in the reimagination session.'))
        : h('section', { class: 'glass board' }, h('p', {}, 'No process steps yet.'), h('button', { class: 'primary', onclick: () => go('interview') }, 'Start the interview')),
      h('section', { class: 'glass board' }, h('h3', {}, 'Important context'), h('div', { class: 'fgrid' }, CONTEXT.map(([label, id]) => h('div', { class: 'ctx' }, h('b', {}, label), h('p', {}, (D.a[id] || '').trim() || h('span', { class: 'hint' }, 'Not answered yet')))))),
      D.steps.length > 0 && h('section', { class: 'glass board' }, h('h3', {}, 'Step by step'), h('table', { class: 'rows' }, h('thead', {}, h('tr', {}, ['Step', 'Done by', 'Kind of work', 'Friction'].map((x) => h('th', {}, x)))),
        h('tbody', {}, D.steps.map((s) => h('tr', {}, h('td', {}, h('b', {}, s.name)), h('td', {}, s.who || '–'), h('td', {}, KINDS.find((k) => k[0] === s.kind)?.[1] || '–'), h('td', {}, s.friction.length ? h('ul', { class: 'flist' }, s.friction.map((f) => h('li', {}, f))) : '–')))))),
      extra.length > 0 && h('section', { class: 'glass board' }, h('h3', {}, 'What we heard'), extra.map(([s, l]) => [h('b', { class: 'sub' }, s.title), l.map((q) => h('div', { class: 'qa' }, h('small', {}, q.q), h('p', {}, D.a[q.id].trim())))])),
      h('section', { class: 'glass board' }, h('h3', {}, openQ.length ? `Still open (${openQ.length})` : 'Nothing left open'), openQ.length ? [h('p', { class: 'hint' }, 'Good questions for the next conversation, or for someone closer to the work.'), h('ul', { class: 'flist' }, openQ.map((q) => h('li', {}, h('button', { class: 'aibtn', onclick: () => { D.at = L.QUESTIONS.findIndex((x) => x.id === q.id); go('interview'); } }, q.q))))] : h('p', {}, 'Every question has an answer.'),
        h('div', { class: 'bar' }, h('button', { class: 'primary', disabled: !own(), title: own() ? 'Opens the reimagination session with this process' : 'Describe the steps first', onclick: toReimagination }, 'Continue to the reimagination session →'),
          h('button', { class: 'add', onclick: dl }, 'Download (.md)'), h('button', { class: 'add', onclick: () => window.print() }, 'Print'),
          h('button', { class: 'add', onclick: () => { if (confirm('Start over? This clears every answer.')) { D = L.blank(); save(); render(); } } }, 'Start over')))));
  if (own()) draw('today');
}
// Hands the interview to the reimagination app: it opens there, says it is ready, and only then receives the answers.
function toReimagination() {
  const w = window.open(CFG.reimagine + '/#discovery');
  if (!w) return toast('Allow pop-ups for this page to open the reimagination session.');
  const on = (e) => {
    if (e.origin !== CFG.reimagine || e.data !== 'reimagine-ready') return;
    removeEventListener('message', on);
    w.postMessage(L.handover(D), CFG.reimagine);
    toast('Sent. The reimagination session starts from this process.');
  };
  addEventListener('message', on);
}

function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 3600); }
function render() { return D.view === 'interview' ? renderInterview() : D.view === 'summary' ? renderSummary() : renderIntro(); }
fetch('/api/config').then((r) => r.json()).then((c) => { CFG = c; }, () => {}).then(render);
