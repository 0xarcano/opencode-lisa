# Lisa

Lisa turns unstructured thinking into actionable artifacts via focused interviews plus durable workspace files.

## When To Use Lisa

Use **`/lisa`** when narrowing a single feature or epic into a Markdown PRD, Ralph-compatible user stories (`{slug}.json`), and **`{slug}-progress.txt`** checklists prior to coding.

Use **`/lisa-discovery`** (append **`--discovery`**) when aligning on broader roadmap goals, consolidating SRS/notes, gathering multiple probable capabilities, then emitting **`{slug}-features.{md,json}`** payloads.

Reuse **`--context`/`-c` paths** liberally—they land in persisted state so every question can reconcile against authoritative docs without re-reading user chat.

Use **`/lisa-resume`** after interruptions—the agent inspects **`interviewKind`** to decide between **`lisa_finalize`** versus **`lisa_finalize_feature_list`**.

## Available Tools

- **`lisa_init`** bootstraps spec or discovery sessions from slash arguments (presence of **`--discovery`** toggles backlog mode).
- **`lisa_list` / `lisa_read` / `lisa_update_draft`** manipulate shared `.opencode/lisa/` state for every mode.
- **`lisa_finalize`** closes **spec interviews** (`interviewKind: "spec"`).
- **`lisa_finalize_feature_list`** closes **discovery interviews** (`interviewKind: "feature-list"`).
- **`lisa_cleanup`** deletes only in-progress ephemeral files.

Never call the wrong finalize tool—plugin errors surfaced to operators reference the counterpart.

## Workflow

1. Start with **`/lisa "feature"`** or **`/lisa-discovery "roadmap brainstorm"`**.
2. Ask one calibrated question per turn; escalate depth only after surface coverage.
3. If **`firstPrinciples`** is toggled (`-f`), spend opening turns challenging framing before enumerating backlog or stories.
4. Refresh `.opencode/lisa/draft/*.md` every few answers (`lisa_update_draft`).
5. Finalize only when the operator explicitly signals wrapping up (`done`, etc.).

### Finalization Contracts

Spec mode emits Ralph JSON + progress ASCII; discovery mode skips Ralph progress scaffolding and persists normalized feature rows `{ id?, title, summary, rationale?, notes? }`.

After finalization helpers return, echo **`SPEC COMPLETE`** verbatim and cease tool use.
