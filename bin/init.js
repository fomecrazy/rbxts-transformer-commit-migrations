#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

// find package.json
let dir = process.cwd();
while (!existsSync(resolve(dir, "package.json"))) dir = resolve(dir, "..");

const huskyDir = resolve(dir, ".husky");
const hookFile = resolve(huskyDir, "pre-commit");

if (!existsSync(huskyDir)) {
  console.error("No .husky folder found. Run `npx husky init` first.");
  process.exit(1);
}

const setupResolve = `npx resolve-commit-migrations\n`;

if (existsSync(hookFile)) {
  const existing = readFileSync(hookFile, "utf-8");
  if (!existing.includes(setupResolve)) {
    writeFileSync(hookFile, existing + setupResolve);
  }
} else {
  writeFileSync(hookFile, `#!/bin/sh\n${setupResolve}`);
}

console.log("Added rbxts-macro stamp to .husky/pre-commit");