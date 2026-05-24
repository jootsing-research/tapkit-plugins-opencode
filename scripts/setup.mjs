#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PACKAGE_NAME = "@jootsing-research/opencode-tapkit";
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
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const sourceSkillsDir = path.join(packageRoot, "skills");

const args = new Set(process.argv.slice(2));
const globalInstall = args.has("--global");
const projectInstall = args.has("--project") || !globalInstall;
const dryRun = args.has("--dry-run");
const force = args.has("--force");
const skipConfig = args.has("--skip-config");
const skipSkills = args.has("--skip-skills");

if (args.has("--help") || args.has("-h")) {
  console.log(`Usage: opencode-tapkit [--project|--global] [--force] [--dry-run] [--skip-config] [--skip-skills]

Installs OpenCode config and TapKit skills.

  --project      Update ./opencode.json and ./.opencode/skills (default)
  --global       Update ~/.config/opencode/opencode.json and global skills
  --force        Replace existing TapKit skill files
  --dry-run      Print planned writes without changing files
  --skip-config  Do not update opencode.json
  --skip-skills  Do not copy skills
`);
  process.exit(0);
}

function globalConfigDir() {
  if (process.env.XDG_CONFIG_HOME) {
    return path.join(process.env.XDG_CONFIG_HOME, "opencode");
  }
  return path.join(process.env.HOME ?? "", ".config", "opencode");
}

function stripJsonComments(input) {
  let output = "";
  let inString = false;
  let escape = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
        output += char;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inString) {
      output += char;
      if (escape) {
        escape = false;
      } else if (char === "\\") {
        escape = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      output += char;
      continue;
    }

    if (char === "/" && next === "/") {
      inLineComment = true;
      i += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      i += 1;
      continue;
    }

    output += char;
  }

  return output.replace(/,\s*([}\]])/g, "$1");
}

function readJsonFile(file) {
  if (!fs.existsSync(file)) return {};
  const raw = fs.readFileSync(file, "utf8");
  return JSON.parse(stripJsonComments(raw));
}

function writeJsonFile(file, value) {
  const body = `${JSON.stringify(value, null, 2)}\n`;
  if (dryRun) {
    console.log(`[dry-run] write ${file}`);
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body);
}

function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) {
    throw new Error(`Missing source directory: ${source}`);
  }

  if (fs.existsSync(destination)) {
    if (!force) return false;
    if (!dryRun) fs.rmSync(destination, { recursive: true, force: true });
  }

  if (dryRun) {
    console.log(`[dry-run] copy ${source} -> ${destination}`);
    return true;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
  return true;
}

function mergeOpenCodeConfig(file) {
  const config = readJsonFile(file);

  config.$schema ??= "https://opencode.ai/config.json";

  const plugins = Array.isArray(config.plugin) ? config.plugin : [];
  if (!plugins.includes(PACKAGE_NAME)) {
    config.plugin = [...plugins, PACKAGE_NAME];
  } else {
    config.plugin = plugins;
  }

  config.mcp = {
    ...(typeof config.mcp === "object" && config.mcp ? config.mcp : {}),
    tapkit: {
      type: "remote",
      url: TAPKIT_MCP_URL,
      enabled: true,
      ...((config.mcp?.tapkit && typeof config.mcp.tapkit === "object") ? config.mcp.tapkit : {}),
    },
  };

  const configuredSkills = (typeof config.skills === "object" && config.skills)
    ? config.skills
    : {};
  const skillPaths = Array.isArray(configuredSkills.paths)
    ? configuredSkills.paths
    : [];
  if (!skillPaths.includes(skillsPathValue)) {
    config.skills = {
      ...configuredSkills,
      paths: [...skillPaths, skillsPathValue],
    };
  } else {
    config.skills = {
      ...configuredSkills,
      paths: skillPaths,
    };
  }

  config.permission = {
    ...(typeof config.permission === "object" && config.permission ? config.permission : {}),
    skill: {
      ...((config.permission?.skill && typeof config.permission.skill === "object") ? config.permission.skill : {}),
    },
  };

  for (const skill of SKILL_NAMES) {
    config.permission.skill[skill] ??= "allow";
  }

  writeJsonFile(file, config);
}

const targetRoot = projectInstall ? process.cwd() : globalConfigDir();
const configFile = projectInstall
  ? path.join(targetRoot, "opencode.json")
  : path.join(targetRoot, "opencode.json");
const targetSkillsDir = projectInstall
  ? path.join(targetRoot, ".opencode", "skills")
  : path.join(targetRoot, "skills");
const skillsPathValue = projectInstall ? ".opencode/skills" : targetSkillsDir;

if (!skipConfig) mergeOpenCodeConfig(configFile);

if (!skipSkills) {
  for (const name of SKILL_NAMES) {
    const copied = copyDirectory(
      path.join(sourceSkillsDir, name),
      path.join(targetSkillsDir, name),
    );
    console.log(`${copied ? "installed" : "kept"} skill: ${name}`);
  }
}

console.log("");
console.log("TapKit OpenCode setup complete.");
console.log(`Config: ${configFile}`);
console.log(`Skills: ${targetSkillsDir}`);
console.log("");
console.log("Next checks:");
console.log("  opencode debug config");
console.log("  opencode debug skill");
console.log("  opencode mcp list");
console.log("  opencode mcp auth tapkit");
