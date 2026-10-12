# Process Discovery

The conversation before a process reimagination workshop. It does two things with a client in the room:

1. **Shows what reimagining a process means**, in three pictures that turn into each other: the process as it runs today, the same process with AI bolted on top of its steps, and the process built around AI, where gathering and comparing are no longer steps people hand to each other and people stay where judgement is needed.
2. **Interviews the client about their current process**, one question at a time: the steps, where it starts and ends, who is involved, the systems, standard versus exception, friction at each step, judgement versus legwork, and why now. Their process is drawn as they describe it, and at the end it is redrawn in the three pictures.

```bash
npm start        # http://localhost:4270
npm test
```

No dependencies and no model. Everything the client says stays in their browser (localStorage) until they hand it over.

## How it works

- **The three pictures** use an example process until the client has described their own. The reimagined picture is an illustration built from their answers on judgement and legwork; it is not a design. Only what can be counted from the picture is shown (steps, hand-overs, steps done by a person). No savings are claimed.
- **Interviewer notes** (top right in the interview) show what to listen for at each question.
- **Leave it open.** Any question can be skipped. Unanswered questions become the "Still open" list for the next conversation.
- **Current state** is the result on one page: the process and its friction, the five context fields (scope, start trigger, end trigger, systems, stakeholders), each step with who does it and what kind of work it is, and what was heard. Print it or download it as Markdown.
- **Continue to the reimagination session** opens the Process Reimagination app (`REIMAGINE_URL`, default `http://localhost:4173`) and hands the interview over: the session there starts with the steps, the context and the friction filled in.

## Where things live

- `public/content.js`: the three pictures and every question. Edit here to change what is asked.
- `public/logic.js`: pure logic. The layout of the pictures, interview progress, the summary and the hand-over. Covered by `logic.test.js`.
- `public/app.js`, `style.css`: UI. `server.js`: static files.
