import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import {
  cleanup,
  finalizeInterview,
  initializeInterview,
  listInterviews,
  readInterview,
  updateDraft,
  type LisaCategory,
  type UserStory,
} from "./lisa.js"

export * from "./lisa.js"

const LisaPlugin: Plugin = async () => {
  return {
    tool: {
      lisa_init: tool({
        description: "Initialize a Lisa specification interview from command arguments.",
        args: {
          arguments: tool.schema.string().describe("Raw command arguments from /lisa-plan."),
        },
        async execute(args, context) {
          const state = await initializeInterview(context.directory, args.arguments)
          return JSON.stringify(state, null, 2)
        },
      }),

      lisa_list: tool({
        description: "List in-progress Lisa interviews.",
        args: {},
        async execute(_args, context) {
          const interviews = await listInterviews(context.directory)
          return JSON.stringify(interviews, null, 2)
        },
      }),

      lisa_read: tool({
        description: "Read a Lisa interview state and draft. If slug is omitted, read the most recently updated interview.",
        args: {
          slug: tool.schema.string().optional().describe("Feature slug to resume."),
        },
        async execute(args, context) {
          const interview = await readInterview(context.directory, args.slug)
          return JSON.stringify(interview, null, 2)
        },
      }),

      lisa_update_draft: tool({
        description: "Replace the Lisa draft and update question count.",
        args: {
          slug: tool.schema.string(),
          draft: tool.schema.string(),
          questionCount: tool.schema.number().optional(),
        },
        async execute(args, context) {
          const state = await updateDraft(context.directory, args.slug, args.draft, args.questionCount)
          return JSON.stringify(state, null, 2)
        },
      }),

      lisa_finalize: tool({
        description: "Finalize a Lisa interview by writing Markdown, JSON, and progress output files.",
        args: {
          slug: tool.schema.string(),
          description: tool.schema.string(),
          markdown: tool.schema.string(),
          userStories: tool.schema.array(
            tool.schema.object({
              id: tool.schema.string(),
              category: tool.schema.enum(["setup", "core", "integration", "polish"]),
              title: tool.schema.string(),
              description: tool.schema.string(),
              acceptanceCriteria: tool.schema.array(tool.schema.string()),
              passes: tool.schema.boolean().default(false),
              notes: tool.schema.string().default(""),
            }),
          ),
        },
        async execute(args, context) {
          const stories: UserStory[] = args.userStories.map((story) => ({
            ...story,
            category: story.category as LisaCategory,
            passes: false,
            notes: story.notes ?? "",
          }))
          const output = await finalizeInterview(context.directory, args.slug, {
            description: args.description,
            markdown: args.markdown,
            userStories: stories,
          })
          return JSON.stringify(output, null, 2)
        },
      }),

      lisa_cleanup: tool({
        description: "Remove all in-progress Lisa interview state files. Does not delete finalized specs.",
        args: {},
        async execute(_args, context) {
          const removed = await cleanup(context.directory)
          return `Removed ${removed} in-progress Lisa interview(s).`
        },
      }),
    },
  }
}

export { LisaPlugin, LisaPlugin as server }
export default LisaPlugin
