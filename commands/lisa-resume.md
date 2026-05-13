---
description: Resume an in-progress Lisa specification interview
---

Call `lisa_list` to find in-progress Lisa interviews.

If none exist, say that no in-progress Lisa interviews were found.

If exactly one exists, call `lisa_read` with its slug and continue the interview from the draft.

If multiple exist, list their feature names, slugs, and updated timestamps, then ask the user which one to resume. After the user chooses, call `lisa_read` with that slug.

Continue with the same rules as `/lisa-plan`: ask one focused question at a time, update the draft with `lisa_update_draft`, and finalize only when the user asks to finish. On finalization, call `lisa_finalize`, output exactly `SPEC COMPLETE`, and stop.
