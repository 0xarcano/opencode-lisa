import assert from "node:assert/strict"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { getInstallStatus, installAssets } from "../bin/cli.js"

test("installer copies Lisa commands and skill files", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "open-lisa-cli-"))

  try {
    const results = await installAssets(cwd)

    assert.equal(results.length, 7)
    assert.equal(await readFile(path.join(cwd, ".opencode", "commands", "lisa.md"), "utf8").then(Boolean), true)
    assert.equal(await readFile(path.join(cwd, ".opencode", "skills", "lisa", "SKILL.md"), "utf8").then(Boolean), true)

    const status = await getInstallStatus(cwd)
    assert.equal(status.ok, true)
  } finally {
    await rm(cwd, { recursive: true, force: true })
  }
})

test("installer is idempotent and doctor detects missing files", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "open-lisa-cli-"))

  try {
    await installAssets(cwd)
    await writeFile(path.join(cwd, ".opencode", "commands", "lisa.md"), "custom\n", "utf8")

    const secondRun = await installAssets(cwd)
    const lisaCommand = secondRun.find((entry) => entry.relativePath === path.join(".opencode", "commands", "lisa.md"))
    assert.equal(lisaCommand?.status, "updated")

    await rm(path.join(cwd, ".opencode", "skills", "lisa", "SKILL.md"), { force: true })
    const status = await getInstallStatus(cwd)
    assert.equal(status.ok, false)
    assert.deepEqual(
      status.files.filter((file) => !file.exists).map((file) => file.relativePath),
      [path.join(".opencode", "skills", "lisa", "SKILL.md")],
    )
  } finally {
    await rm(cwd, { recursive: true, force: true })
  }
})
