#!/usr/bin/env node

import ts from "typescript";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { glob } from "glob";
import loadMigrationEntries from "../util/loadMigrationEntries.js";
import { CONFIG, MACRO, MACRO_CALL_REGEX, MACRO_REGEX} from "../config.js"

function findEntryName(node: ts.Node): string | null {
	let current: ts.Node | undefined = node.parent;

	while (current) {
		if (ts.isPropertyAssignment(current) || ts.isShorthandPropertyAssignment(current)) {
			const name = ts.isIdentifier(current.name) ? current.name.text : null;
			return name;
		}

		if (ts.isCallExpression(current) || ts.isPropertyAccessExpression(current)) {
			current = current.parent;
		} else {
			break;
		}
	}

	return null;
}

const files = glob.sync("src/**/*.ts");
const migrations: string[] = [];
const migrationData: Record<string, { timestamp: number, order: number }> = {};
const usedOrders = new Set<number>();

function walk(node: ts.Node, ctx: { changed: boolean }): void {
	if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && MACRO_REGEX.test(node.expression.text)) {
		const entry = findEntryName(node)

		const orderArg = node.arguments[0];
		const order = orderArg ? ts.isNumericLiteral(orderArg) ? parseInt(orderArg.getText()) : null : 0;

		if (order !== null && usedOrders.has(order)) {
			console.error("Multiple of the same migration orders found. Every migration has to have a unique order.");
			process.exit(1);
		}
		if (!entry) {
			console.error("Invalid migration entry, maybe you called a $migrate outside a table?");
			process.exit(1);
		}

		if (!orderArg?.getText().includes("__resolved")) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			usedOrders.add(order!);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			migrationData[entry] = { timestamp: Date.now(), order: order! };
			ctx.changed = true
		}

		migrations.push(entry);
	}

	ts.forEachChild(node, (node) => {
		walk(node, ctx)
	});
}

for (const file of files) {
	const src = readFileSync(file, "utf-8");
	const sourceFile = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true);

	const ctx = { changed: false }
	walk(sourceFile, ctx);

	if (ctx.changed) {
		writeFileSync(file, src.replaceAll(MACRO_CALL_REGEX, `${MACRO}("__resolved")`))
	}
}

const [previousMigrations] = loadMigrationEntries(CONFIG);
const removedMigrations = previousMigrations.filter((v) => !migrations.includes(v));

if (removedMigrations.length > 0) {
	console.error(`Removed migrations: ${removedMigrations}. Migrations should never be removed!`);
	process.exit(1);
}

const newMigrations = migrations.filter((v) => !previousMigrations.includes(v));

if (newMigrations.length === 0) process.exit(0);

const newLines = newMigrations
	.map((e) => `\t${e}: { timestamp: ${migrationData[e].timestamp}, order: ${migrationData[e].order} },`)
	.join("\n");

const migratedEntries = migrations.map((e) => `"${e}"`).join(" | ");

if (!existsSync(CONFIG)) {
	writeFileSync(
		CONFIG,
		`type MigratedEntries = ${migratedEntries}\n\ninterface MigrationData {\n\ttimestamp: number\n\torder: number\n}\n\n// AUTO-GENERATED MIGRATION CONFIG - DO NOT EDIT\nexport const MIGRATED_ENTRIES: Record<MigratedEntries, MigrationData> = {\n${newLines}\n};\n`
	);
} else {
	const lines = readFileSync(CONFIG, "utf-8").split("\n");
	const typeIndex = lines.findIndex((l) => l.startsWith("type MigratedEntries"));

	if (typeIndex !== -1) {
		lines[typeIndex] = `type MigratedEntries = ${migratedEntries}`;
	}

	const updated = lines.join("\n").replace(/\};\s*$/, `${newLines}\n};`);
	writeFileSync(CONFIG, updated);
}

console.log(`Successfuly resolved ${newMigrations.length} new migrations. [${newMigrations}]`);