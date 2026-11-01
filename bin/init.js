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

const setupResolve = "npx resolve-commit-migrations";
const legacyResolve = "npx resolve-commit-migrations | xargs git add";

if (existsSync(hookFile)) {
	const existing = readFileSync(hookFile, "utf-8");
	const lines = existing.split("\n");
	const isSetup = (l) => l.trim() === setupResolve;
	const isLegacy = (l) => l.trim() === legacyResolve;

	if (lines.some(isLegacy)) {
		const updated = lines.some(isSetup)
			? lines.filter((l) => !isLegacy(l))
			: lines.map((l) => (isLegacy(l) ? l.replace(legacyResolve, setupResolve) : l));
		writeFileSync(hookFile, updated.join("\n"));
	} else if (!lines.some(isSetup)) {
		writeFileSync(hookFile, existing + `\n${setupResolve}\n`);
	}
} else {
	writeFileSync(hookFile, `${setupResolve}\n`);
}

console.log("Added commit-migration macro stamp to .husky/pre-commit");