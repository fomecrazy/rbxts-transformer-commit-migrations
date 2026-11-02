import ts from "typescript";
import { MACRO_REGEX } from "../config.js";

export function findMacroCall(node: ts.Node): ts.CallExpression | undefined {
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && MACRO_REGEX.test(node.expression.text)) {
    return node;
  }

  if (ts.isCallExpression(node)) {
    for (const arg of node.arguments) {
      if (ts.isCallExpression(arg) && ts.isIdentifier(arg.expression) && MACRO_REGEX.test(arg.expression.text)) {
        return arg;
      }
    }
  }

  return undefined;
}

function isMacroCall(node: ts.Node): node is ts.CallExpression & { expression: ts.Identifier } {
	return ts.isCallExpression(node) && ts.isIdentifier(node.expression) && MACRO_REGEX.test(node.expression.text);
}

// roblox-ts type-checks the output, so the literal needs the macro's branded return type
function createMigrationLiteral(macro: string, order: number, path: string[]): ts.Expression {
	return ts.factory.createAsExpression(
		ts.factory.createArrayLiteralExpression([
			ts.factory.createNumericLiteral(order),
			ts.factory.createArrayLiteralExpression(
				path.map(p => ts.factory.createStringLiteral(p)),
				false
			),
		], false),
		ts.factory.createTypeReferenceNode("ReturnType", [
			ts.factory.createTypeQueryNode(ts.factory.createIdentifier(macro)),
		])
	);
}

export function replaceMacroCall(node: ts.Node, order: number, path: string[]): ts.Node | undefined {
	if (isMacroCall(node)) return createMigrationLiteral(node.expression.text, order, path);

	if (ts.isCallExpression(node)) {
		const newArgs: ts.Expression[] = [];
		let changed = false;

		for (const arg of node.arguments) {
			if (isMacroCall(arg)) {
				newArgs.push(createMigrationLiteral(arg.expression.text, order, path));
				changed = true;
			} else {
				newArgs.push(arg);
			}
		}

		if (changed) {
			return ts.factory.updateCallExpression(node, node.expression, node.typeArguments, newArgs);
		}
	}

	return ts.visitEachChild(node, (child) => replaceMacroCall(child, order, path), undefined);
}