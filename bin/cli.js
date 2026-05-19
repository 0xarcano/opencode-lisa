#!/usr/bin/env node
import { access, copyFile, mkdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const assetRoot = path.join(root, "assets")

const managedFiles = [
  ["commands", "lisa.md"],
  ["commands", "lisa-plan.md"],
  ["commands", "lisa-discovery.md"],
  ["commands", "lisa-resume.md"],
  ["commands", "lisa-cleanup.md"],
  ["commands", "lisa-help.md"],
  ["skills", "lisa", "SKILL.md"],
]

export async function installAssets(cwd = process.cwd()) {
  const results = []

  for (const parts of managedFiles) {
    const sourcePath = path.join(assetRoot, ...parts)
    const targetPath = path.join(cwd, ".opencode", ...parts)
    await mkdir(path.dirname(targetPath), { recursive: true })

    const source = await readFile(sourcePath, "utf8")
    let status = "created"

    try {
      const existing = await readFile(targetPath, "utf8")
      status = existing === source ? "unchanged" : "updated"
    } catch (error) {
      if (!isNotFound(error)) throw error
    }

    if (status !== "unchanged") {
      await copyFile(sourcePath, targetPath)
    }

    results.push({
      relativePath: path.relative(cwd, targetPath),
      status,
    })
  }

  return results
}

export async function getInstallStatus(cwd = process.cwd()) {
  const files = await Promise.all(
    managedFiles.map(async (parts) => {
      const relativePath = path.join(".opencode", ...parts)
      const filePath = path.join(cwd, relativePath)

      try {
        await access(filePath)
        return { relativePath, exists: true }
      } catch (error) {
        if (!isNotFound(error)) throw error
        return { relativePath, exists: false }
      }
    }),
  )

  return {
    ok: files.every((file) => file.exists),
    files,
  }
}

export async function main(argv = process.argv.slice(2)) {
  const { command, cwd } = parseArgs(argv)

  if (command === "help") {
    printHelp()
    return 0
  }

  if (command === "doctor") {
    const status = await getInstallStatus(cwd)
    if (!status.ok) {
      console.error("Lisa is not fully installed for OpenCode in this project.")
      for (const file of status.files.filter((entry) => !entry.exists)) {
        console.error(`- missing ${file.relativePath}`)
      }
      console.error("Run `opencode-lisa install` to install the missing command and skill files.")
      return 1
    }

    console.log("Lisa is installed for OpenCode in this project.")
    console.log("Type `/lisa` in OpenCode and confirm it appears in slash-command suggestions.")
    return 0
  }

  const results = await installAssets(cwd)
  const changed = results.filter((file) => file.status !== "unchanged")

  console.log(`Lisa bootstrap complete in ${cwd}`)
  for (const file of results) {
    console.log(`- ${file.relativePath} (${file.status})`)
  }
  console.log("OpenCode loads the npm plugin from `opencode.json`, and discovers slash commands from `.opencode/commands/*.md`.")
  console.log("Type `/lisa` in OpenCode and confirm it appears in slash-command suggestions.")
  console.log(changed.length === 0 ? "No files needed updates." : `Updated ${changed.length} managed Lisa file(s).`)
  return 0
}

function parseArgs(argv) {
  let command = "install"
  let cwd = process.cwd()

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === "install" || arg === "doctor" || arg === "validate" || arg === "help" || arg === "--help" || arg === "-h") {
      command = arg === "validate" ? "doctor" : arg === "--help" || arg === "-h" ? "help" : arg
      continue
    }

    if (arg === "--opencode") {
      command = "install"
      continue
    }

    if (arg === "--cwd") {
      const value = argv[index + 1]
      if (!value) throw new Error("--cwd requires a directory")
      cwd = path.resolve(value)
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return { command, cwd }
}

function printHelp() {
  console.log("Usage: opencode-lisa [install|doctor]")
  console.log("")
  console.log("Commands:")
  console.log("- install  Copy Lisa command and skill files into .opencode/ (default)")
  console.log("- doctor   Verify that the required .opencode files are present")
  console.log("")
  console.log("Compatibility:")
  console.log("- --opencode runs the install command for older setup instructions")
}

function isNotFound(error) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectRun) {
  main().then(
    (code) => {
      process.exitCode = code
    },
    (error) => {
      console.error(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    },
  )
}
