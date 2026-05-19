---
description: Resume an in-progress Lisa specification interview
---

Call `lisa_list` to find in-progress Lisa interviews.

If none exist, say that no in-progress Lisa interviews were found.

If exactly one exists, call `lisa_read` with its slug and continue the interview from the draft.

If multiple exist, list their feature names, slugs and `interviewKind` values, updated timestamps, then ask the user which one to resume. After the user chooses, call `lisa_read` with that slug.

Continue interviewing with matching rules (`/lisa` breadth vs `/lisa-discovery`). Update the draft with `lisa_update_draft`.

When the user wants to finalize:

- If `interviewKind` is `"feature-list"` (discovery mode), finish with **`lisa_finalize_feature_list`**.
- Otherwise finish with **`lisa_finalize`** (Markdown PRD, Ralph-compatible JSON, progress file).

Output exactly **`SPEC COMPLETE`** after whichever finalize succeeds, then stop.
