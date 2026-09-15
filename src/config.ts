function escapeRegExp(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const CONFIG = "migrations.config.ts";
export const MACRO = "$migrate";
export const MACRO_REGEX = new RegExp(escapeRegExp(MACRO));
export const MACRO_CALL_REGEX = new RegExp(escapeRegExp(MACRO) + "\\([^)]*\\)", "g");