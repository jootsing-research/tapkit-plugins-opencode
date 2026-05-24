import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";

const TAPKIT_MCP_NAME = "tapkit";
const TAPKIT_MCP_URL = "https://mcp.tapkit.ai/mcp";

const SKILL_NAMES = [
  "tapkit",
  "tapkit-cli",
  "clock",
  "craigslist",
  "facebook",
  "hinge",
  "instagram",
  "linkedin",
  "mail",
  "reddit",
  "telegram",
  "tiktok",
  "twitter",
  "uber-eats",
  "weather",
  "whatsapp",
] as const;

function packageSkillsDirectory(): string {
  const distDirectory = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(distDirectory, "..", "skills");
}

function appendUnique(values: unknown, value: string): string[] {
  const list = Array.isArray(values)
    ? values.filter((item): item is string => typeof item === "string")
    : [];
  return list.includes(value) ? list : [...list, value];
}

function configureTapKit(config: Record<string, any>, skillsDirectory: string): void {
  config.mcp = {
    ...(typeof config.mcp === "object" && config.mcp ? config.mcp : {}),
    [TAPKIT_MCP_NAME]: {
      type: "remote",
      url: TAPKIT_MCP_URL,
      enabled: true,
      ...((config.mcp?.[TAPKIT_MCP_NAME] &&
      typeof config.mcp[TAPKIT_MCP_NAME] === "object")
        ? config.mcp[TAPKIT_MCP_NAME]
        : {}),
    },
  };

  const skills = typeof config.skills === "object" && config.skills
    ? config.skills
    : {};
  config.skills = {
    ...skills,
    paths: appendUnique(skills.paths, skillsDirectory),
  };

  if (typeof config.permission === "string") return;

  config.permission = {
    ...(typeof config.permission === "object" && config.permission ? config.permission : {}),
  };

  const skillPermissions = typeof config.permission.skill === "object" &&
    config.permission.skill
    ? config.permission.skill
    : {};

  config.permission.skill = { ...skillPermissions };
  for (const skill of SKILL_NAMES) {
    config.permission.skill[skill] ??= "allow";
  }
}

function guide(topic?: string): string {
  const normalized = topic?.toLowerCase().trim();

  if (normalized === "config" || normalized === "setup" || normalized === "mcp") {
    return [
      "TapKit for OpenCode is configured through OpenCode MCP and skills.",
      "",
      "Add this MCP server to opencode.json:",
      "",
      JSON.stringify(
        {
          mcp: {
            [TAPKIT_MCP_NAME]: {
              type: "remote",
              url: TAPKIT_MCP_URL,
              enabled: true,
            },
          },
        },
        null,
        2,
      ),
      "",
      "Then run `opencode mcp auth tapkit` if OpenCode reports that TapKit needs OAuth.",
    ].join("\n");
  }

  if (normalized === "skills") {
    return [
      "Bundled TapKit skills:",
      "",
      ...SKILL_NAMES.map((name) => `- ${name}`),
      "",
      "OpenCode discovers project skills from `.opencode/skills/<name>/SKILL.md` and global skills from `~/.config/opencode/skills/<name>/SKILL.md`.",
    ].join("\n");
  }

  return [
    "TapKit controls a physical iPhone through the TapKit MCP server.",
    "",
    "Recommended workflow:",
    "1. Use the `tapkit` skill.",
    "2. Call the TapKit MCP phone-list tool first and choose a `phone_id`.",
    "3. Take a screenshot before acting.",
    "4. Tap, swipe, open apps, or paste text with TapKit tools.",
    "5. Take another screenshot to verify the result.",
    "",
    "If OpenCode prefixes MCP tool names, use the visible `tapkit_*` tool names for the TapKit operations described in the skills.",
  ].join("\n");
}

export const TapKitOpenCodePlugin: Plugin = async ({ client }) => {
  const skillsDirectory = packageSkillsDirectory();

  try {
    await client.app.log({
      body: {
        service: "tapkit",
        level: "info",
        message: `TapKit OpenCode plugin loaded. MCP server: ${TAPKIT_MCP_URL}. Skills: ${skillsDirectory}`,
      },
    });
  } catch {
    // Logging is best-effort and should never block plugin loading.
  }

  return {
    config: async (config) => {
      configureTapKit(config as Record<string, any>, skillsDirectory);
    },

    tool: {
      tapkit_help: tool({
        description: "Show TapKit setup, MCP, skill, and iPhone-control workflow guidance.",
        args: {
          topic: tool.schema
            .string()
            .optional()
            .describe("Optional topic: setup, mcp, skills, or workflow."),
        },
        async execute(args) {
          return guide(args.topic);
        },
      }),
    },

    "experimental.session.compacting": async (_input, output) => {
      output.context.push(
        [
          "## TapKit",
          "",
          "When continuing iPhone-control work, use the TapKit MCP tools and the TapKit skills. Start with phone discovery, pass `phone_id` on each TapKit call, and keep the loop screenshot -> act -> screenshot until the requested phone workflow is verified.",
        ].join("\n"),
      );
    },
  };
};

export default TapKitOpenCodePlugin;
