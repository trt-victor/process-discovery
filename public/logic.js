// Pure logic (no DOM) so it runs in the browser and in `node --test`.
import { SECTIONS, CONTEXT, EXAMPLE, KINDS } from './content.js';

export const blank = () => ({ view: 'intro', mode: 'today', at: 0, notes: false, a: {}, steps: [] });
export const exampleSteps = () => EXAMPLE.map(([name, kind], i) => ({ id: 'e' + i, name, kind, who: '', friction: [] }));
export const QUESTIONS = SECTIONS.flatMap((s) => s.questions.map((q) => ({ ...q, section: s })));
const filled = (D, q) => (q.type === 'steps' ? D.steps.length >= 2 : q.type === 'who' ? D.steps.some((s) => s.who.trim()) : q.type === 'friction' ? D.steps.some((s) => s.friction.length) : q.type === 'kind' ? D.steps.length > 0 && D.steps.every((s) => s.kind) : !!(D.a[q.id] || '').trim());
export const answered = (D) => QUESTIONS.filter((q) => filled(D, q)).length;
export const open = (D) => QUESTIONS.filter((q) => !filled(D, q));
const kindOf = (s) => s.kind || 'both'; // not said yet: assume a person is still needed

/* ---------- the three pictures ---------- */
// Where every block sits in each picture, in percent of the canvas width. Keys are stable across pictures, so a
// block that exists in two of them moves from one place to the other instead of being redrawn.
// rows: 0 = above the process, 1 = the process, 2 = below it.
export function layout(steps, mode) {
  const n = steps.length, gap = 1.2, w = (100 - gap * (n - 1)) / n, at = (i) => i * (w + gap);
  if (mode !== 'new') {
    return steps.flatMap((s, i) => [
      { key: s.id, cls: 'step', row: 1, left: at(i), width: w, text: s.name, sub: s.who },
      { key: 'ai-' + s.id, cls: 'ai', row: 0, left: at(i), width: w, text: 'AI on top', hidden: mode !== 'bolt' || kindOf(s) === 'judgement' },
    ]);
  }
  // Reimagined: steps that are legwork fold into one block of agents; steps with judgement stay, as decisions.
  const stay = steps.filter((s) => kindOf(s) !== 'legwork'), fold = steps.filter((s) => kindOf(s) === 'legwork');
  const cols = 1 + stay.length + 1, cw = (100 - gap * (cols - 1)) / cols, col = (i, span = 1) => ({ left: i * (cw + gap), width: cw * span + gap * (span - 1) });
  const fw = fold.length ? Math.min(100 / fold.length - 0.4, 18) : 0;
  return [
    { key: 'watch', cls: 'new', row: 0, ...col(0, cols), text: 'Watches every case continuously', sub: 'Problems are flagged before they arrive, not found afterwards' },
    { key: 'agents', cls: 'agent', row: 1, ...col(0), text: 'Agents prepare the whole case', sub: fold.length ? `${fold.length} step${fold.length === 1 ? '' : 's'} of gathering, copying and comparing` : 'Everything gathered and checked' },
    ...stay.map((s, i) => ({ key: s.id, cls: 'decide', row: 1, ...col(1 + i), text: s.name, sub: kindOf(s) === 'both' ? 'A person decides the exceptions' : 'A person decides, with everything attached' })),
    { key: 'done', cls: 'new', row: 1, ...col(cols - 1), text: 'Outcome confirmed', sub: 'With the full trail of who decided what' },
    ...fold.map((s, i) => ({ key: s.id, cls: 'folded', row: 2, left: i * (fw + 0.4), width: fw, text: s.name })),
    ...steps.map((s) => ({ key: 'ai-' + s.id, cls: 'ai', row: 0, left: 0, width: cw, text: 'AI on top', hidden: true })),
  ];
}
// What can be counted from the picture itself. No savings are claimed: those come out of the workshop.
export function counts(steps, mode) {
  const stay = steps.filter((s) => kindOf(s) !== 'legwork').length;
  return mode === 'new' ? { steps: stay + 2, handovers: stay + 1, people: stay } : { steps: steps.length, handovers: Math.max(0, steps.length - 1), people: steps.length };
}

/* ---------- what the interview produced ---------- */
export const title = (D) => (D.a.name || '').trim() || 'Your process';
const kindLabel = (k) => KINDS.find((x) => x[0] === k)?.[1] || 'Not said yet';

export function summaryMd(D) {
  const out = [`# Current state: ${title(D)}`, '', `Process steps: ${D.steps.map((s) => s.name).join(' → ') || 'not described yet'}`, '', '## Context'];
  for (const [label, id] of CONTEXT) out.push(`- **${label}:** ${(D.a[id] || 'not answered').trim().replace(/\n/g, ' / ')}`);
  out.push('', '## Step by step');
  for (const s of D.steps) out.push(`- **${s.name}**${s.who ? ` (${s.who})` : ''}: ${kindLabel(s.kind).toLowerCase()}${s.friction.map((f) => `\n  - Friction: ${f}`).join('')}`);
  for (const sec of SECTIONS) {
    const rows = sec.questions.filter((q) => ['text', 'short'].includes(q.type) && q.id !== 'name' && !CONTEXT.some((c) => c[1] === q.id) && (D.a[q.id] || '').trim());
    if (rows.length) out.push('', `## ${sec.title}`, ...rows.map((q) => `- **${q.q}** ${D.a[q.id].trim().replace(/\n/g, ' / ')}`));
  }
  const o = open(D);
  if (o.length) out.push('', '## Still open', ...o.map((q) => `- ${q.q}`));
  return out.join('\n') + '\n';
}

// What the reimagination app receives: the process as a case, the context fields of its first stage, friction per step.
export function handover(D) {
  const cut = (v, n) => String(v || '').trim().slice(0, n);
  return {
    type: 'discovery-session', name: cut(title(D), 80),
    brief: [D.a.challenge, D.a.volume && 'Volume: ' + D.a.volume, D.a.now && 'Why now: ' + D.a.now].filter(Boolean).map((x) => cut(x, 400)).join(' · '),
    steps: D.steps.slice(0, 12).map((s) => ({ name: cut(s.name, 60), friction: s.friction.slice(0, 8).map((f) => cut(f, 200)) })),
    context: Object.fromEntries(CONTEXT.map(([, id]) => [id, cut(D.a[id], 1000)])),
  };
}
