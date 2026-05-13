#!/usr/bin/env node
import { copyFile, mkdir } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const source = join(root, "commands")
const target = join(process.cwd(), ".opencode", "commands")
const files = ["lisa-plan.md", "lisa-resume.md", "lisa-cleanup.md", "lisa-help.md"]

await mkdir(target, { recursive: true })

for (const file of files) {
  await copyFile(join(source, file), join(target, file))
}

console.log(`Installed ${files.length} Lisa command(s) to ${target}`)
