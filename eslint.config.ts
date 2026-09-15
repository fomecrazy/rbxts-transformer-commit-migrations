import eslintConfigPrettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
	...tseslint.configs.stylisticTypeChecked,
	...tseslint.configs.strictTypeChecked,
	{
		"ignores": ["bin"]
	},
	{
		plugins: {
			"@typescript-eslint": tseslint.plugin,
		},
		languageOptions: {
			parserOptions: {
				projectService: {
					defaultProject: "./tsconfig.json",
					allowDefaultProject: ["*.config.ts"],
				},
			},
		},
		rules: {
			"@typescript-eslint/array-type": ["error", { default: "array-simple", readonly: "generic" }],
			"@typescript-eslint/consistent-type-exports": "error",
			"@typescript-eslint/consistent-type-imports": "error",
			"@typescript-eslint/explicit-module-boundary-types": "error",
			"@typescript-eslint/ban-ts-comment": ["error", { "ts-expect-error": "allow-with-description" }],
			"@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true }],
			"@typescript-eslint/explicit-member-accessibility": "error",
			"@typescript-eslint/member-ordering": "error",
			"@typescript-eslint/no-explicit-any": "error",
			"@typescript-eslint/no-inferrable-types": "off",
			"@typescript-eslint/no-misused-spread": "error",
			"@typescript-eslint/no-non-null-assertion": "error",
			"@typescript-eslint/no-unnecessary-condition": "off",
			"@typescript-eslint/no-unsafe-argument": "error",
			"@typescript-eslint/no-unsafe-assignment": "error",
			"@typescript-eslint/no-unsafe-call": "off",
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					args: "all",
					argsIgnorePattern: "^_",
					caughtErrors: "all",
					caughtErrorsIgnorePattern: "^_",
					destructuredArrayIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					ignoreRestSiblings: true,
				},
			],
			"@typescript-eslint/prefer-nullish-coalescing": "error",
			"@typescript-eslint/prefer-optional-chain": "error",
			"@typescript-eslint/prefer-readonly": "error",
			"@typescript-eslint/prefer-reduce-type-parameter": "error",
			"@typescript-eslint/require-await": "error",
			"@typescript-eslint/restrict-template-expressions": "off",
		},
	},
	eslintConfigPrettier,
]);
