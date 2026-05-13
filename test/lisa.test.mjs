import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import {
  cleanup,
  createProgressFile,
  createRalphSpec,
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
  })
})

test("interview lifecycle writes state, draft, outputs, and cleanup", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "opencode-lisa-"))

  try {
    const state = await initializeInterview(cwd, '"user auth" --output-dir specs')
    assert.equal(state.slug, "user-auth")

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
