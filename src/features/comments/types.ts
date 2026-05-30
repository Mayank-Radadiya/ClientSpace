/**
 * Shape of the `metadata` JSONB column on the comments table.
 * Used for annotation pin data. Cast once at the boundary
 * instead of scattering `as any` across routers.
 *
 * All fields match the insert shape in createAnnotation mutation.
 */
export interface CommentMetadata {
  x: number;
  y: number;
  page: number | null;
  resolved: boolean;
  pinNumber: number;
}
