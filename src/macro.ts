import ts from "typescript";
import { MACRO_REGEX } from "./config.js";

export function findMacroCall(node: ts.Node): ts.CallExpression | undefined {
	if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && MACRO_REGEX.test(node.expression.text)) {
		return node;
	}

	let found: ts.CallExpression | undefined;
	ts.forEachChild(node, (child) => {if (found) return; found = findMacroCall(child)});

	return found
}

export function replaceMacroCall(node: ts.Node, replacement: number): ts.Node | undefined {
	if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && MACRO_REGEX.test(node.expression.text)) {
		return ts.factory.createNumericLiteral(replacement)
	}

	return ts.visitEachChild(node, (child) => replaceMacroCall(child, replacement), undefined)
}