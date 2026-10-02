export type Migration = [order: number, path: string[]] & { readonly __migrationKind: "migrate" };
export type TransformMigration = [order: number, path: string[]] & { readonly __migrationKind: "transform" };

export declare function $migrate(order: number | "__resolved"): Migration;
export declare function $transform(order: number | "__resolved"): TransformMigration;
