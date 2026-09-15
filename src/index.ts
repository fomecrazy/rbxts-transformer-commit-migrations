import ts from "typescript"
import { findMacroCall, replaceMacroCall } from "./macro.js";
import loadMigrationEntries from "./util/loadMigrationEntries.js";
import { CONFIG } from "./config.js";

export default function (_: ts.Program): ts.TransformerFactory<ts.SourceFile> {
	return (ctx: ts.TransformationContext): (file: ts.SourceFile) => ts.SourceFile => {
		return (file: ts.SourceFile): ts.SourceFile => {
			const [entryArr, entries] = loadMigrationEntries(CONFIG) as [string[], Record<string, { timestamp: number, order: number }>];
			const orderedEntries: unknown[] = entryArr
				.map((i) => ({ i, timestamp: entries[i].timestamp, order: entries[i].order }))
				.toSorted((a, b) => a.timestamp - b.timestamp || a.order - b.order)
				.map(({ i }) => i)
			
			console.log(orderedEntries)

			function visit(node: ts.Node): ts.Node {
				if (!ts.isPropertyAssignment(node) || !findMacroCall(node.initializer)) return ts.visitEachChild(node, visit, ctx);

				const entry = node.name.getText(file)
				const replacement = orderedEntries.indexOf(entry)
				if (replacement !== -1) {
					const newInit = replaceMacroCall(node.initializer, replacement);
					return ts.factory.createPropertyAssignment(node.name, newInit as ts.Expression);
				}

				return ts.visitEachChild(node, visit, ctx)
			}

			return ts.visitNode(file, visit) as ts.SourceFile
		}
	}
}