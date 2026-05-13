---
description: Start a Lisa specification interview for a feature
---

Initialize a Lisa interview by calling `lisa_init` with these raw arguments:

```text
$ARGUMENTS
```

Then conduct a specification interview for the initialized feature.

Rules:

- Ask one focused question at a time.
- Prefer non-obvious questions about scope, constraints, data, UX, edge cases, risks, and tradeoffs.
- If `firstPrinciples` is true, first ask 3-5 questions that challenge whether this is the right problem and smallest useful solution.
- Continue until the user says done, finalize, finished, complete, wrap up, or equivalent.
- Respect `maxQuestions`; when the limit is reached, summarize what is known and ask whether to finalize or continue.
- Update the draft every 2-3 answers by calling `lisa_update_draft`.
- Use context files listed in state when relevant.

Finalization:

- Do not implement the feature.
- Do not edit unrelated files.
- Create a complete Markdown PRD and Ralph-compatible user story list.
- Call `lisa_finalize` with the slug, description, markdown, and user stories.
- After finalization, output exactly `SPEC COMPLETE` and stop.
