---
description: Show Lisa workflow help
---

Show concise help for OpenCode Lisa.

Include:

- `/lisa "feature name"` starts a specification interview for **one capability** (Markdown PRD, Ralph-compatible JSON with user stories, progress file `{slug}-progress.txt`).
- `/lisa-plan "feature name"` is an alias of `/lisa`.
- `/lisa-discovery "session title"` runs **project discovery**. Internally prepend or append **`--discovery`** so `lisa_init` sees it; repeats `--context` / `-c` for any SRS, vision, backlog, roadmap, or spike notes desired.
- Options supported on slash args: `--context <file>` / `-c`, `--output-dir <dir>`, `--max-questions <n>`, `--first-principles` / `-f`, plus **`--discovery`** for discovery slash flow.
- `/lisa-resume` resumes whichever interview was last touched; branching finalize tool depends on **`interviewKind`** in state (`"spec"` vs `"feature-list"`).
- `/lisa-cleanup` removes in-progress Lisa state directories only (`rm -rf`-style wipe of `.opencode/lisa/`), leaving finalized **`docs/specs/`** Markdown/JSON untouched.
- Discovery outputs: **`{slug}-features.md`** and **`{slug}-features.json`** (no Ralph branch file / progress txt).
- Default output directory (`--output-dir` fallback) stays `docs/specs`.
