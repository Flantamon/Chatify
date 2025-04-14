export type BulkCreateResult =
  | { user: { id: number; email: string; role: string }; token: string }
  | { error: string; user: string };
