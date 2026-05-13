# OpenCode Lisa

Native OpenCode port of [Lisa](https://github.com/blencorp/lisa): an interactive specification interview workflow that turns a feature idea into a Markdown PRD, Ralph-compatible JSON, and a progress file.

## Install

Add the plugin to `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-lisa"]
}
```

Install the command templates into a project:

```sh
npx opencode-lisa-install
```

This copies command files into `.opencode/commands/`.

## Commands

```text
/lisa-plan "user authentication"
/lisa-plan "payments" --context docs/prd.md --output-dir specs --max-questions 15
/lisa-plan "dashboard" --first-principles
/lisa-resume
/lisa-cleanup
/lisa-help
```

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

`/lisa-plan` initializes state and starts an interview. The agent asks focused questions, updates the draft after every few answers, and stops only when the user asks to finalize. Finalization writes the spec files and does not implement the feature.

`--first-principles` adds an initial phase that challenges whether the feature should be built and what the smallest useful solution might be.

## Development

```sh
npm install
npm run build
npm test
```
