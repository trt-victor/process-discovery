// All content lives here: the three pictures of the explainer and the interview. Edit this file to change what is asked.
// The interview follows the "Today's Reality" board of the reimagination workshop: the process and its steps, scope,
// start and end trigger, systems, stakeholders, friction per step, and the probing questions around it.

// The three pictures. `talk` are discussion prompts for the room.
export const MODES = [
  { id: 'today', name: 'Today', title: 'How the process runs today',
    text: 'Steps follow each other. Each one is done by a person or a team, and the work waits at every hand-over.',
    talk: ['Where does the work wait the longest?', 'Who would notice first if a step were skipped?'] },
  { id: 'bolt', name: 'AI bolted on', title: 'AI added on top of the same process',
    text: 'The steps and their order stay exactly as they are. AI is placed on top of some of them: a summary here, a draft there. Each step gets a little faster. The hand-overs, the waiting and the rework between the steps do not change.',
    talk: ['Where have you already added AI or automation to a step?', 'What changed for the people before and after that step?'] },
  { id: 'new', name: 'Reimagined', title: 'The process built around AI',
    text: 'The process is drawn again from what it has to achieve. Gathering, copying and comparing are no longer steps that people hand to each other: agents prepare the whole case. People stay where judgement is needed and receive everything already assembled. Some steps disappear, and new ones appear that were not possible before.',
    talk: ['If the whole case arrived prepared, what would a person still have to decide?', 'What could you watch continuously that you now only find out afterwards?'] },
];

// Shown before the client has described their own process.
export const EXAMPLE = [
  ['Request arrives', 'legwork'], ['Check it is complete', 'legwork'], ['Enter it in the system', 'legwork'],
  ['Review and approve', 'judgement'], ['Deliver the result', 'legwork'], ['Follow up and report', 'legwork'],
];

export const KINDS = [['legwork', 'Gathering, copying, comparing'], ['both', 'A bit of both'], ['judgement', 'Real judgement']];

// type: 'text' (one answer), 'short' (one line), 'steps' (the list of steps), 'who' / 'friction' / 'kind' (one answer per step).
// why: said to the client. listen: for the interviewer.
export const SECTIONS = [
  { id: 'process', title: 'Your process', intro: 'We start with one process, described the way you would explain it to a new colleague.', questions: [
    { id: 'name', type: 'short', q: 'Which process are we talking about?', ph: 'e.g. Billing and invoicing', why: 'One process, named in your words. Not a department and not a system.' },
    { id: 'steps', type: 'steps', q: 'What are the steps, in the order they happen?', why: 'Five to eight steps is enough. We will look closer at each one.', listen: 'Steps people describe from memory are the real process. Note where they hesitate or disagree.' },
  ] },
  { id: 'edges', title: 'Where it starts and ends', intro: 'A process is easier to improve once everyone agrees where it begins and when it is finished.', questions: [
    { id: 'scope', type: 'text', q: 'What is in scope, and what is not?', ph: 'In: … / Out: …', why: 'It keeps the conversation on one thing.', listen: 'Variants: different types, regions or customers that follow different rules.' },
    { id: 'start', type: 'text', q: 'What exactly starts it? Who can say "this is ready to begin", and on what evidence?', why: 'Many problems later on begin with an unclear start.', listen: 'A trigger nobody owns, or one that arrives by e-mail.' },
    { id: 'end', type: 'text', q: 'When is it done? Who decides that?', why: '"Done" for us is not always "done" for the customer.' },
  ] },
  { id: 'people', title: 'Who is involved', intro: 'Now the people: who does the work, who depends on it, who owns it.', questions: [
    { id: 'who', type: 'who', q: 'Who does each step today?', why: 'It shows where the work changes hands.' },
    { id: 'stakeholders', type: 'text', q: 'Who else touches it or depends on it?', ph: 'Teams, customers, suppliers, auditors…', why: 'People outside the process often feel its problems first.' },
    { id: 'owner', type: 'short', q: 'Who owns the process as a whole?', ph: 'A role, not a team', why: 'Someone has to be able to decide that it changes.', listen: '"Nobody really" is an answer worth writing down.' },
  ] },
  { id: 'systems', title: 'Systems and information', intro: 'What the work runs on, and where the knowledge really sits.', questions: [
    { id: 'systems', type: 'text', q: 'Which systems are involved?', ph: 'e.g. ERP, CRM, ticketing, shared mailbox, spreadsheets', why: 'Every system is a place where information is typed in again.' },
    { id: 'logic', type: 'text', q: 'Does the system hold the real logic, or do people rely on extra files, inboxes and what they know?', why: 'What lives in someone\'s head is what makes the process fragile.', listen: 'Names of people ("ask Maria"), personal spreadsheets, checklists on paper.' },
    { id: 'missing', type: 'text', q: 'Which fields or documents are most often missing or inconsistent?', why: 'Missing information is the most common cause of rework.' },
  ] },
  { id: 'flow', title: 'Standard and exception', intro: 'Most processes have an easy path and a hard one. We want to know how big each is.', questions: [
    { id: 'volume', type: 'short', q: 'How many cases go through it, and how long does one take?', ph: 'e.g. 400 a month, 40 minutes each', why: 'One number makes everything else concrete.', listen: 'A range or "it depends" is fine. Do not let them guess precisely.' },
    { id: 'split', type: 'text', q: 'What share is standard, and what share needs special handling?', why: 'The standard part is where the volume is. The exceptions are where the time goes.' },
    { id: 'origin', type: 'text', q: 'Which exceptions start inside this process, and which arrive from an earlier one?', why: 'Some problems can only be solved upstream.' },
    { id: 'touchless', type: 'text', q: 'Which cases already go through without anyone touching them? What must be true for that?', why: 'It tells us what "straight through" already means here.' },
  ] },
  { id: 'friction', title: 'Friction', intro: 'Where time, effort, information or quality is lost. Facts and examples, not blame.', questions: [
    { id: 'friction', type: 'friction', q: 'At each step: where is time, effort, information or quality lost?', why: 'We go step by step so nothing is skipped.', listen: 'Write their words. "We redo the whole check when something changes" is worth more than "inefficient".' },
    { id: 'firsttime', type: 'text', q: 'What stops the result from being right the first time, seen from the customer?', why: 'A result can be correct for us and still be rejected by them.' },
  ] },
  { id: 'judgement', title: 'Judgement and control', intro: 'Which parts need a person because they need judgement, and which only because it has always been done that way.', questions: [
    { id: 'kind', type: 'kind', q: 'For each step: is it gathering, copying and comparing, or is it real judgement?', why: 'This is the question the reimagination is built on.', listen: 'Challenge "a person always has to check it". Ask what the person decides once everything is in front of them.' },
    { id: 'approvals', type: 'text', q: 'Which checks and approvals are required by law, finance or policy, and which exist out of habit?', why: 'Required controls stay. Habits can be questioned.' },
    { id: 'interpret', type: 'text', q: 'Where does someone have to interpret a contract, a rule or a situation?', why: 'That is where people will stay involved.' },
  ] },
  { id: 'why', title: 'Challenges and why now', intro: 'Last part: what makes this worth changing, and who would stand behind it.', questions: [
    { id: 'challenge', type: 'text', q: 'What is the biggest challenge with this process today?', why: 'In your own words, the one thing you would fix first.' },
    { id: 'double', type: 'text', q: 'What breaks if the volume doubles?', why: 'It shows whether the process can grow or only the team can.' },
    { id: 'now', type: 'text', q: 'Why now? What happens if nothing changes in the next year?', why: 'A reason to act is what turns an idea into a project.' },
  ] },
];

// The five context columns of the current-state board, in order: label and the question that fills it.
export const CONTEXT = [['Process scope', 'scope'], ['Start trigger', 'start'], ['End trigger', 'end'], ['Systems involved', 'systems'], ['Stakeholders', 'stakeholders']];
