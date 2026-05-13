# OpenCode Lisa

Native OpenCode port of [Lisa](https://github.com/blencorp/lisa): an interactive specification interview workflow that turns a feature idea into a Markdown PRD, Ralph-compatible JSON, and a progress file.

## Install

From the consumer project root, add the plugin to `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-lisa"]
}
```

From that same project root, bootstrap the project-local OpenCode files:

```sh
npx --package opencode-lisa opencode-lisa
```

That one command installs the files OpenCode discovers on disk:

- `.opencode/commands/lisa.md`
- `.opencode/commands/lisa-plan.md`
- `.opencode/commands/lisa-resume.md`
- `.opencode/commands/lisa-cleanup.md`
- `.opencode/commands/lisa-help.md`
- `.opencode/skills/lisa/SKILL.md`

OpenCode currently discovers slash-command suggestions from `.opencode/commands/*.md`, so npm plugin registration alone is not enough to make `/lisa` appear in suggestions.

If you run the bootstrap command from the wrong directory, the files will be installed into the wrong `.opencode/` folder and OpenCode will not discover Lisa for your project.

Verify the install at any time:

```sh
npx --package opencode-lisa opencode-lisa doctor
```

`opencode-lisa-install` still works as a compatibility alias and now installs both commands and the Lisa skill.

## Install Model

This package has two parts:

1. The npm plugin from `opencode.json`, which provides the `lisa_*` tools.
2. The project-local `.opencode` files, which make `/lisa` discoverable and install the Lisa skill.

The bootstrap command above handles the second part explicitly so the setup is complete and unsurprising.

## Commands

```text
/lisa "user authentication"
/lisa-plan "user authentication"
/lisa-plan "payments" --context docs/prd.md --output-dir specs --max-questions 15
/lisa-plan "dashboard" --first-principles
/lisa-resume
/lisa-cleanup
/lisa-help
```

`/lisa` is the canonical command. `/lisa-plan` remains available as a compatibility alias.

## Verification

1. Run `npx --package opencode-lisa opencode-lisa doctor`.
2. Confirm `.opencode/commands/lisa.md` exists.
3. Confirm `.opencode/skills/lisa/SKILL.md` exists.
4. Start OpenCode in the project.
5. Type `/lisa` and confirm it appears in slash-command suggestions.
6. If `/lisa` does not appear but the files exist, restart OpenCode in that project and check again.
7. Run `/lisa-help` or `/lisa "feature name"` as a smoke test.

## Upgrading

If you already use an older version of OpenCode Lisa:

```sh
npx --package opencode-lisa opencode-lisa
```

That refreshes the managed command and skill files in `.opencode/`.

Older examples that mention `opencode-lisa-install` refer to the compatibility installer binary, not a different npm package. The npm package name is `opencode-lisa`.

If you previously installed `@0xarcano/open-lisa`, switch your `opencode.json` entry and `npx --package ...` commands to `opencode-lisa`.

## Runtime Files

During an interview, state is stored under `.opencode/lisa/`:

- `.opencode/lisa/state/{slug}.json`
- `.opencode/lisa/draft/{slug}.md`

When finalized, Lisa writes:

- `{output-dir}/{slug}.md`
- `{output-dir}/{slug}.json`
- `{output-dir}/{slug}-progress.txt`

The default output directory is `docs/specs`.

## Workflow

`/lisa` initializes state and starts an interview. `/lisa-plan` remains available as a compatibility alias. The agent asks focused questions, updates the draft after every few answers, and stops only when the user asks to finalize. Finalization writes the spec files and does not implement the feature.

`--first-principles` adds an initial phase that challenges whether the feature should be built and what the smallest useful solution might be.

## Development

```sh
npm install
npm run build
npm test
```
