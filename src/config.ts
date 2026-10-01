function escapeRegExp(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const CONFIG = "migrations.config.ts";
export const MIGRATE_MACRO = "$migrate";
export const TRANSFORM_MACRO = "$transform";

const MACROS = [MIGRATE_MACRO, TRANSFORM_MACRO].map(escapeRegExp).join("|");

export const MACRO_REGEX = new RegExp(`^(?:${MACROS})$`);
// group 1 holds the macro name, so a replace can keep it
export const MACRO_CALL_REGEX = new RegExp(`(?<![\\w$])(${MACROS})\\([^)]*\\)`, "g");