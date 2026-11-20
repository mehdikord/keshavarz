/** Page sizes accepted by cursor-paginated app endpoints. */
export type CursorListLimit = 20 | 50 | 100;

/** `meta` block returned by cursor-paginated app endpoints. */
export interface CursorMeta {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}
