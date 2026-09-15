import ts from "typescript"
import { findMacroCall, replaceMacroCall } from "./util/macro.js";
import loadMigrationEntries from "./util/loadMigrationEntries.js";
import { CONFIG } from "./config.js";
import { existsSync } from "node:fs";

interface TransformerConfig {
	configPath?: string;
	files?: string[];
}

export default function (_: ts.Program, config?: TransformerConfig): ts.TransformerFactory<ts.SourceFile> {
	return (ctx: ts.TransformationContext): (file: ts.SourceFile) => ts.SourceFile => {
		const configPath = config?.configPath ?? CONFIG;
		if (!existsSync(configPath)) {
			console.error(`Invalid migration config path ${configPath}`);
			process.exit(1);
		}

		const [entryArr, entries] = loadMigrationEntries(configPath) as [string[], Record<string, { timestamp: number, order: number, path: string[] }>];
		const orderedEntries: string[] = entryArr
			.map((i) => ({ i, timestamp: entries[i].timestamp, order: entries[i].order }))
			.toSorted((a, b) => a.timestamp - b.timestamp || a.order - b.order)
			.map(({ i }) => i)
		
		return (file: ts.SourceFile): ts.SourceFile => {
			if (config?.files && !config.files.some((f) => file.fileName.includes(f))) return file;

			function visit(node: ts.Node, currentPath: string[]): ts.Node {
				if (!ts.isPropertyAssignment(node)) return ts.visitEachChild(node, (node) => visit(node, currentPath), ctx);

				const entry = ts.isIdentifier(node.name) ? node.name.text : node.name.getText(file);
				const newPath = [...currentPath, entry]
				if (!findMacroCall(node.initializer)) return ts.visitEachChild(node, (node) => visit(node, newPath), ctx);

				const order = orderedEntries.indexOf(newPath.join("/"))
				if (order !== -1) {
					const newInit = replaceMacroCall(node.initializer, order, newPath);
					return ts.factory.createPropertyAssignment(node.name, newInit as ts.Expression);
				}

				return ts.visitEachChild(node, (node) => visit(node, newPath), ctx)
			}

			return ts.visitNode(file, (node) => visit(node, [])) as ts.SourceFile
		}
	}
}