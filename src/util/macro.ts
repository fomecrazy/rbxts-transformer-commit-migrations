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

export function replaceMacroCall(node: ts.Node, order: number, path: string[]): ts.Node | undefined {
	if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
		const newArgs: ts.Expression[] = [];
		let changed = false;

		for (const arg of node.arguments) {
			if (ts.isCallExpression(arg) && ts.isIdentifier(arg.expression) && MACRO_REGEX.test(arg.expression.text)) {
			newArgs.push(ts.factory.createNumericLiteral(order));
			newArgs.push(
				ts.factory.createArrayLiteralExpression(
					path.map(p => ts.factory.createStringLiteral(p)),
					false
				)
			);
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