import assert from "node:assert/strict"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import {
  cleanup,
  createFeatureListOutput,
  createProgressFile,
  createRalphSpec,
  finalizeFeatureListInterview,
  finalizeInterview,
  initializeInterview,
  listInterviews,
  parseLisaArgs,
  readInterview,
  slugify,
  updateDraft,
} from "../dist/lisa.js"

test("slugify creates stable feature slugs", () => {
  assert.equal(slugify("User Authentication!"), "user-authentication")
  assert.equal(slugify("  OAuth + SSO / Login  "), "oauth-sso-login")
  assert.equal(slugify("!!!"), "feature")
})

test("parseLisaArgs supports Lisa options", () => {
  const options = parseLisaArgs('"payment processing" --context docs/prd.md --context docs/api.md --output-dir specs --max-questions 15 --first-principles')

  assert.deepEqual(options, {
    feature: "payment processing",
    slug: "payment-processing",
    context: ["docs/prd.md", "docs/api.md"],
    outputDir: "specs",
    maxQuestions: 15,
    firstPrinciples: true,
    interviewKind: "spec",
  })
})

test("parseLisaArgs enables discovery feature-list interviews", () => {
  assert.deepEqual(parseLisaArgs('"Q3 backlog" --discovery -c vision.md'), {
    feature: "Q3 backlog",
    slug: "q3-backlog",
    context: ["vision.md"],
    outputDir: "docs/specs",
    maxQuestions: 0,
    firstPrinciples: false,
    interviewKind: "feature-list",
  })
})

test("interview lifecycle writes state, draft, outputs, and cleanup", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "opencode-lisa-"))

  try {
    const state = await initializeInterview(cwd, '"user auth" --output-dir specs')
    assert.equal(state.slug, "user-auth")
    assert.equal(state.interviewKind, "spec")

    const interviews = await listInterviews(cwd)
    assert.equal(interviews.length, 1)

    const updated = await updateDraft(cwd, "user-auth", "# Draft\n\nUpdated.\n", 2)
    assert.equal(updated.questionCount, 2)

    const interview = await readInterview(cwd, "user-auth")
    assert.match(interview.draft, /Updated/)

    const stories = [
      {
        id: "US-001",
        category: "setup",
        title: "Create auth schema",
        description: "As a developer, I need user tables for authentication.",
        acceptanceCriteria: ["Migration creates users table"],
        passes: false,
        notes: "",
      },
    ]

    await finalizeInterview(cwd, "user-auth", {
      description: "User authentication",
      markdown: "# User Authentication\n",
      userStories: stories,
    })

    assert.equal(await readFile(path.join(cwd, "specs", "user-auth.md"), "utf8"), "# User Authentication\n")
    const json = JSON.parse(await readFile(path.join(cwd, "specs", "user-auth.json"), "utf8"))
    assert.equal(json.branchName, "ralph/user-auth")
    assert.equal(await readFile(path.join(cwd, "specs", "user-auth-progress.txt"), "utf8"), "[PENDING] US-001 - Create auth schema\n")
    assert.equal((await listInterviews(cwd)).length, 0)
    assert.equal(await cleanup(cwd), 0)
  } finally {
    await rm(cwd, { recursive: true, force: true })
  }
})

test("discovery interviews emit feature backlog artifacts", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "opencode-lisa-"))

  try {
    const input = `"roadmap session" --discovery --output-dir specs -c roadmap.md`
    const state = await initializeInterview(cwd, input)
    assert.equal(state.slug, "roadmap-session")
    assert.equal(state.interviewKind, "feature-list")
    assert.ok(state.markdownPath.endsWith(`${state.slug}-features.md`))
    assert.ok(state.jsonPath.endsWith(`${state.slug}-features.json`))
    assert.equal(state.progressPath, undefined)

    const interview = await readInterview(cwd, state.slug)
    assert.match(interview.draft, /Project discovery/)

    await finalizeFeatureListInterview(cwd, state.slug, {
      description: "Roadmap gleaned from interview plus roadmap.md",
      markdown: "## Candidates\n\n- Observability rollout\n",
      features: [{ title: "Unified metrics", summary: "Single pane infra metrics" }],
    })

    await assert.rejects(finalizeInterview(cwd, state.slug, { description: "", markdown: "", userStories: [] }))
    await assert.rejects(async () =>
      finalizeFeatureListInterview(cwd, "missing-slug", { description: "", markdown: "", features: [] }),
    )

    assert.equal(await readFile(path.join(cwd, "specs", `${state.slug}-features.md`), "utf8"), "## Candidates\n\n- Observability rollout\n")
    const output = JSON.parse(await readFile(path.join(cwd, "specs", `${state.slug}-features.json`), "utf8"))
    assert.equal(output.interviewKind, "feature-list")
    assert.equal(output.features[0].id, "FE-001")
    assert.equal(output.features[0].title, "Unified metrics")
    assert.equal((await listInterviews(cwd)).length, 0)
  } finally {
    await rm(cwd, { recursive: true, force: true })
  }
})

test("legacy state without interviewKind still finalizes specs", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "opencode-lisa-"))

  try {
    const state = await initializeInterview(cwd, '"legacy compat"')
    assert.equal(state.interviewKind, "spec")

    const rawPath = path.join(cwd, ".opencode/lisa/state", `${state.slug}.json`)
    const raw = JSON.parse(await readFile(rawPath, "utf8"))
    delete raw.interviewKind
    await writeFile(rawPath, `${JSON.stringify(raw, null, 2)}\n`, "utf8")

    await finalizeInterview(cwd, state.slug, {
      description: "Still works",
      markdown: "## Legacy markdown\n",
      userStories: [
        {
          id: "US-001",
          category: "core",
          title: "Keep shipping",
          description: "...",
          acceptanceCriteria: ["tests pass"],
          passes: false,
          notes: "",
        },
      ],
    })

    const json = JSON.parse(await readFile(path.join(cwd, "docs/specs", `${state.slug}.json`), "utf8"))
    assert.equal(json.project, state.slug)
  } finally {
    await rm(cwd, { recursive: true, force: true })
  }
})

test("createFeatureListOutput normalizes feature ids", () => {
  const doc = createFeatureListOutput(
    "backlog-review",
    "Summary",
    [
      { id: "", title: "First", summary: "S1", rationale: "Because" },
      { title: "Second", summary: "S2", notes: "later" },
    ],
  )

  assert.equal(doc.project, "backlog-review")
  assert.equal(doc.features[0].id, "FE-001")
  assert.equal(doc.features[1].id, "FE-002")
  assert.ok(doc.generatedAt.length > 0)
})

test("Ralph spec and progress helpers normalize output", () => {
  const stories = [
    {
      id: "",
      category: "core",
      title: "Search documents",
      description: "As a user, I can search documents.",
      acceptanceCriteria: ["Search returns matching documents"],
      passes: true,
      notes: "draft",
    },
  ]

  assert.deepEqual(createRalphSpec("search", "Search feature", stories), {
    project: "search",
    branchName: "ralph/search",
    description: "Search feature",
    userStories: [
      {
        id: "US-001",
        category: "core",
        title: "Search documents",
        description: "As a user, I can search documents.",
        acceptanceCriteria: ["Search returns matching documents"],
        passes: false,
        notes: "draft",
      },
    ],
  })
  assert.equal(createProgressFile(stories), "[PENDING] US-001 - Search documents\n")
})
