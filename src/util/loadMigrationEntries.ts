import ts from "typescript";
import fs from "fs";
import path from "path";

const VAR_NAME = "MIGRATED_ENTRIES"

function reconstructProperties(properties: ts.NodeArray<ts.ObjectLiteralElementLike>): Record<string, unknown> {
	const obj: Record<string, unknown> = {}

	for (const prop of properties) {
		if (!ts.isPropertyAssignment(prop)) continue;

		const name = ts.isIdentifier(prop.name) ? prop.name.text : prop.name.getText()
		const init = prop.initializer;
		if (ts.isNumericLiteral(init)) obj[name] = Number(init.text)
		else if (init.kind === ts.SyntaxKind.TrueKeyword) obj[name] = true
		else if (init.kind === ts.SyntaxKind.FalseKeyword) obj[name] = false
	}

	return obj;
}

export default function (config: string): [string[], Record<string, unknown>] {
	const configPath = path.join(process.cwd(), config);
	if (!fs.existsSync(configPath)) return [[], {}];

	const sourceFile = ts.createSourceFile(
		config,
		fs.readFileSync(configPath, "utf-8"),
		ts.ScriptTarget.Latest
	);

	for (const statement of sourceFile.statements) {
		if (!ts.isVariableStatement(statement) || !statement.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) continue;

		const declaration = statement.declarationList.declarations[0];

		if (!ts.isIdentifier(declaration.name) || declaration.name.text !== VAR_NAME || !declaration.initializer || !ts.isObjectLiteralExpression(declaration.initializer)) continue;

		const result: string[] = [];
		const object: Record<string, unknown> = {}

		for (const prop of declaration.initializer.properties) {
			if (!ts.isPropertyAssignment(prop) || !ts.isStringLiteral(prop.name) || !ts.isObjectLiteralExpression(prop.initializer)) continue;

			result.push(prop.name.text)
			object[prop.name.text] = reconstructProperties(prop.initializer.properties)
		}

		return [result, object];
	}

	return [[], {}];
}