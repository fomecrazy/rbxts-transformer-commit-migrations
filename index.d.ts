export type MigrateOrder = number & { readonly __migrationKind: "migrate" };
export type TransformOrder = number & { readonly __migrationKind: "transform" };

export declare function $migrate(order: number | "__resolved"): MigrateOrder;
export declare function $transform(order: number | "__resolved"): TransformOrder;
