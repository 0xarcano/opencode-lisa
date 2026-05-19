---
description: Project discovery interview that produces a prioritized feature backlog
---

Initialize a Lisa **discovery / feature-list** interview by calling `lisa_init` with this raw arguments string (`--discovery` must be included):

```text
$ARGUMENTS --discovery
```

Then explore the overall product or platform: personas, pillars, phased delivery, constraints, integrations, differentiation, risks, dependencies, success metrics, etc. Aim to surface **concrete capability candidates**, not scope a single epic.

Rules:

- Ask one focused question at a time.
- Prefer breadth then prioritization unless the user steers narrower.
- If `firstPrinciples` is true on state, spend the first **3–5** questions probing whether priorities or framing need reframing before growing the backlog.
- Continue until the user says done, finalize, finished, complete, wrap up, or equivalent.
- Respect `maxQuestions`; when the limit is reached, summarize what diverged vs agreed and suggest whether to finalize or continue one more sweep.
- Update the discovery draft every **2–3** answers by calling `lisa_update_draft`.
- Explicitly reconcile answers with `--context` file paths persisted in Lisa state whenever they matter.

Finalization:

- Do not ship production code inside this slash command unless the user insists on small samples.
- Produce a Markdown **feature backlog overview** (`markdown`) plus normalized features for JSON.
- Gather every row for `features[]`: `title`, `summary`, optional stable `id` (FE-XXX if obvious), optional `rationale`, optional `notes`.
- Call `lisa_finalize_feature_list` with the slug from state JSON, concise `description` of outcomes, synthesized `markdown`, and `features`.
- Outputs land as `{slug}-features.md` and `{slug}-features.json` beside other specs (default `docs/specs/`).
- After finalization emit exactly **`SPEC COMPLETE`** and stop.
