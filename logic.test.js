import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from './public/logic.js';
import { SECTIONS, MODES, CONTEXT, KINDS } from './public/content.js';

const step = (id, name, kind = '', friction = [], who = '') => ({ id, name, kind, friction, who });
const STEPS = [step('a', 'Billing trigger', 'legwork'), step('b', 'Prepare invoice', 'both', ['Pre-check redone after every change'], 'Billing team'), step('c', 'Create invoice', 'legwork'), step('d', 'Handle disputes', 'judgement'), step('e', 'Hand over')];

test('content is consistent', () => {
  const ids = L.QUESTIONS.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const q of L.QUESTIONS) assert.ok(q.q && q.why && ['short', 'text', 'steps', 'who', 'friction', 'kind'].includes(q.type), q.id);
  for (const [, id] of CONTEXT) assert.equal(L.QUESTIONS.find((q) => q.id === id)?.type, 'text', id);
  assert.deepEqual(MODES.map((m) => m.id), ['today', 'bolt', 'new']);
  assert.ok(L.exampleSteps().every((s) => KINDS.some((k) => k[0] === s.kind)));
  assert.ok(SECTIONS.every((s) => s.intro && s.questions.length));
});

test('the three pictures: same blocks, moved', () => {
  const row = (m, r) => L.layout(STEPS, m).filter((b) => b.row === r && !b.hidden);
  // today: every step in order, nothing on top
  assert.deepEqual(row('today', 1).map((b) => b.key), ['a', 'b', 'c', 'd', 'e']); assert.equal(row('today', 0).length, 0);
  // bolted on: the same row, AI on top of everything except pure judgement
  assert.deepEqual(row('bolt', 1).map((b) => [b.key, b.left]), row('today', 1).map((b) => [b.key, b.left]));
  assert.deepEqual(row('bolt', 0).map((b) => b.key), ['ai-a', 'ai-b', 'ai-c', 'ai-e']);
  // reimagined: legwork folds away, judgement stays as decisions, new blocks appear
  assert.deepEqual(row('new', 1).map((b) => `${b.cls}:${b.key}`), ['agent:agents', 'decide:b', 'decide:d', 'decide:e', 'new:done']);
  assert.deepEqual(row('new', 2).map((b) => b.key), ['a', 'c']); assert.equal(row('new', 0)[0].key, 'watch');
  // every step block exists in all three pictures, so it can move instead of vanishing
  for (const m of ['today', 'bolt', 'new']) for (const s of STEPS) assert.ok(L.layout(STEPS, m).some((b) => b.key === s.id), `${m}:${s.id}`);
  for (const m of ['today', 'bolt', 'new']) for (const b of L.layout(STEPS, m)) assert.ok(b.left >= 0 && b.left + b.width <= 100.01, `${m}:${b.key}`);
  assert.deepEqual(L.counts(STEPS, 'today'), { steps: 5, handovers: 4, people: 5 }); assert.deepEqual(L.counts(STEPS, 'bolt'), L.counts(STEPS, 'today'));
  assert.deepEqual(L.counts(STEPS, 'new'), { steps: 5, handovers: 4, people: 3 });
  assert.equal(L.layout([], 'new').filter((b) => b.row === 1).length, 2); assert.deepEqual(L.layout([], 'today'), []);
});

test('interview progress, summary and hand-over', () => {
  const D = L.blank();
  assert.equal(L.answered(D), 0); assert.equal(L.open(D).length, L.QUESTIONS.length); assert.equal(L.title(D), 'Your process');
  Object.assign(D, { steps: STEPS, a: { name: 'Billing', scope: 'In: four invoice types\nOut: collections', systems: 'ERP, mailbox', challenge: 'Too much manual checking', volume: '400 a month' } });
  const openIds = L.open(D).map((q) => q.id);
  assert.ok(!openIds.includes('steps') && !openIds.includes('friction') && !openIds.includes('who') && !openIds.includes('scope'));
  assert.ok(openIds.includes('kind') && openIds.includes('start')); // one step has no kind yet
  const md = L.summaryMd(D);
  assert.match(md, /# Current state: Billing/); assert.match(md, /Billing trigger → Prepare invoice/); assert.match(md, /\*\*Process scope:\*\* In: four invoice types \/ Out: collections/);
  assert.match(md, /\*\*Prepare invoice\*\* \(Billing team\): a bit of both\n  - Friction: Pre-check redone/); assert.match(md, /## Still open\n- /); assert.match(md, /\*\*Start trigger:\*\* not answered/);
  const hnd = L.handover(D);
  assert.equal(hnd.type, 'discovery-session'); assert.equal(hnd.name, 'Billing');
  assert.deepEqual(hnd.steps[1], { name: 'Prepare invoice', friction: ['Pre-check redone after every change'] });
  assert.deepEqual(Object.keys(hnd.context), ['scope', 'start', 'end', 'systems', 'stakeholders']); assert.equal(hnd.context.start, '');
  assert.match(hnd.brief, /Too much manual checking · Volume: 400 a month/);
});
