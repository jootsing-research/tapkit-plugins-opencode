#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const rootSkillsDir = path.join(packageRoot, "skills");
const localOpenCodeSkillsDir = path.join(packageRoot, ".opencode", "skills");

const sourceArg = process.argv[2];

function resolveSourceSkillsDir(source) {
  if (!source) return rootSkillsDir;
  const absolute = path.resolve(process.cwd(), source);
  const nested = path.join(absolute, "skills");
  return fs.existsSync(nested) ? nested : absolute;
}

function resetCopy(source, destination) {
  if (!fs.existsSync(source)) {
    throw new Error(`Missing source directory: ${source}`);
  }
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
}

const sourceSkillsDir = resolveSourceSkillsDir(sourceArg);

if (sourceSkillsDir !== rootSkillsDir) {
  resetCopy(sourceSkillsDir, rootSkillsDir);
}

resetCopy(rootSkillsDir, localOpenCodeSkillsDir);

console.log(`Synced skills from ${sourceSkillsDir}`);
console.log(`Updated ${rootSkillsDir}`);
console.log(`Updated ${localOpenCodeSkillsDir}`);
