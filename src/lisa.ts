import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

export type LisaCategory = "setup" | "core" | "integration" | "polish"

export interface LisaOptions {
  feature: string
  slug: string
  context: string[]
  outputDir: string
  maxQuestions: number
  firstPrinciples: boolean
}

export interface LisaState extends LisaOptions {
  createdAt: string
  updatedAt: string
  questionCount: number
  status: "in-progress" | "finalized"
  draftPath: string
  statePath: string
  markdownPath: string
  jsonPath: string
  progressPath: string
}

export interface UserStory {
  id: string
  category: LisaCategory
  title: string
  description: string
  acceptanceCriteria: string[]
  passes: boolean
  notes: string
}

export interface FinalSpec {
  description: string
  markdown: string
  userStories: UserStory[]
}

export interface RalphSpec {
  project: string
  branchName: string
  description: string
  userStories: UserStory[]
}

const DEFAULT_OUTPUT_DIR = "docs/specs"
const STATE_ROOT = ".opencode/lisa"

export function slugify(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "")

  return slug || "feature"
}

export function parseLisaArgs(input: string): LisaOptions {
  const tokens = tokenize(input)
  const featureParts: string[] = []
  const context: string[] = []
  let outputDir = DEFAULT_OUTPUT_DIR
  let maxQuestions = 0
  let firstPrinciples = false

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]

    if (token === "--context" || token === "-c") {
      const value = tokens[index + 1]
      if (!value) throw new Error(`${token} requires a file path`)
      context.push(value)
      index += 1
      continue
    }

    if (token === "--output-dir") {
      const value = tokens[index + 1]
      if (!value) throw new Error("--output-dir requires a directory")
      outputDir = value
      index += 1
      continue
    }

    if (token === "--max-questions") {
      const value = tokens[index + 1]
      if (!value) throw new Error("--max-questions requires a number")
      maxQuestions = Number.parseInt(value, 10)
      if (!Number.isInteger(maxQuestions) || maxQuestions < 0) {
        throw new Error("--max-questions must be a non-negative integer")
      }
      index += 1
      continue
    }

    if (token === "--first-principles" || token === "-f") {
      firstPrinciples = true
      continue
    }

    if (token === "--help" || token === "-h") {
      throw new Error("Help requested")
    }

    if (token.startsWith("-")) throw new Error(`Unknown option: ${token}`)
    featureParts.push(token)
  }

  const feature = featureParts.join(" ").trim()
  if (!feature) throw new Error("Feature name is required")

  return {
    feature,
    slug: slugify(feature),
    context,
    outputDir,
    maxQuestions,
    firstPrinciples,
  }
}

export async function initializeInterview(cwd: string, input: string): Promise<LisaState> {
  const options = parseLisaArgs(input)
  const now = new Date().toISOString()
  const paths = resolveInterviewPaths(cwd, options.slug, options.outputDir)
  const state: LisaState = {
    ...options,
    createdAt: now,
    updatedAt: now,
    questionCount: 0,
    status: "in-progress",
    ...paths,
  }

  await mkdir(path.dirname(paths.statePath), { recursive: true })
  await mkdir(path.dirname(paths.draftPath), { recursive: true })
  await writeState(state)
  await writeFile(
    paths.draftPath,
    [
      `# ${options.feature}`,
      "",
      "## Current Understanding",
      "",
      "Interview initialized. Update this draft as the specification becomes clearer.",
      "",
    ].join("\n"),
    "utf8",
  )

  return state
}

export async function listInterviews(cwd: string): Promise<LisaState[]> {
  const dir = path.join(cwd, STATE_ROOT, "state")
  let files: string[]
  try {
    files = await readdir(dir)
  } catch (error) {
    if (isNotFound(error)) return []
    throw error
  }

  const states = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => readState(path.join(dir, file))),
  )

  return states
    .filter((state) => state.status === "in-progress")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function readInterview(cwd: string, slug?: string): Promise<{ state: LisaState; draft: string }> {
  const state = slug ? await readState(resolveInterviewPaths(cwd, slug, DEFAULT_OUTPUT_DIR).statePath) : await latestState(cwd)
  const draft = await readFile(state.draftPath, "utf8")
  return { state, draft }
}

export async function updateDraft(cwd: string, slug: string, draft: string, questionCount?: number): Promise<LisaState> {
  const statePath = resolveInterviewPaths(cwd, slug, DEFAULT_OUTPUT_DIR).statePath
  const state = await readState(statePath)
  const updated: LisaState = {
    ...state,
    updatedAt: new Date().toISOString(),
    questionCount: questionCount ?? state.questionCount,
  }

  await writeFile(state.draftPath, draft, "utf8")
  await writeState(updated)
  return updated
}

export async function finalizeInterview(cwd: string, slug: string, spec: FinalSpec): Promise<RalphSpec> {
  const statePath = resolveInterviewPaths(cwd, slug, DEFAULT_OUTPUT_DIR).statePath
  const state = await readState(statePath)
  const output = createRalphSpec(state.slug, spec.description, spec.userStories)

  await mkdir(path.dirname(state.markdownPath), { recursive: true })
  await writeFile(state.markdownPath, spec.markdown, "utf8")
  await writeFile(state.jsonPath, `${JSON.stringify(output, null, 2)}\n`, "utf8")
  await writeFile(state.progressPath, createProgressFile(spec.userStories), "utf8")
  await rm(state.statePath, { force: true })

  return output
}

export async function cleanup(cwd: string): Promise<number> {
  const dir = path.join(cwd, STATE_ROOT)
  const interviews = await listInterviews(cwd)
  await rm(dir, { recursive: true, force: true })
  return interviews.length
}

export function createRalphSpec(slug: string, description: string, userStories: UserStory[]): RalphSpec {
  return {
    project: slug,
    branchName: `ralph/${slug}`,
    description,
    userStories: userStories.map((story, index) => ({
      id: story.id || `US-${String(index + 1).padStart(3, "0")}`,
      category: story.category,
      title: story.title,
      description: story.description,
      acceptanceCriteria: story.acceptanceCriteria,
      passes: false,
      notes: story.notes ?? "",
    })),
  }
}

export function createProgressFile(userStories: UserStory[]): string {
  const lines = userStories.map((story, index) => {
    const id = story.id || `US-${String(index + 1).padStart(3, "0")}`
    return `[PENDING] ${id} - ${story.title}`
  })

  return `${lines.join("\n")}${lines.length ? "\n" : ""}`
}

function resolveInterviewPaths(cwd: string, slug: string, outputDir: string) {
  const absoluteOutputDir = path.resolve(cwd, outputDir)
  return {
    statePath: path.join(cwd, STATE_ROOT, "state", `${slug}.json`),
    draftPath: path.join(cwd, STATE_ROOT, "draft", `${slug}.md`),
    markdownPath: path.join(absoluteOutputDir, `${slug}.md`),
    jsonPath: path.join(absoluteOutputDir, `${slug}.json`),
    progressPath: path.join(absoluteOutputDir, `${slug}-progress.txt`),
  }
}

async function latestState(cwd: string): Promise<LisaState> {
  const interviews = await listInterviews(cwd)
  if (interviews.length === 0) throw new Error("No in-progress Lisa interviews found")
  return interviews[0]
}

async function readState(filePath: string): Promise<LisaState> {
  return JSON.parse(await readFile(filePath, "utf8")) as LisaState
}

async function writeState(state: LisaState): Promise<void> {
  await writeFile(state.statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8")
}

function tokenize(input: string): string[] {
  const tokens: string[] = []
  let current = ""
  let quote: "'" | "\"" | undefined

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]

    if (quote) {
      if (char === quote) {
        quote = undefined
      } else {
        current += char
      }
      continue
    }

    if (char === "'" || char === "\"") {
      quote = char
      continue
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current)
        current = ""
      }
      continue
    }

    current += char
  }

  if (quote) throw new Error("Unclosed quote in arguments")
  if (current) tokens.push(current)
  return tokens
}

function isNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}
