/**
 * Parse and format capsule timestamps from the database.
 * All DB timestamps are stored as UTC (ISO); we parse and display in the user's local time.
 */

/**
 * Parse an ISO timestamp from the database into a Date (exact instant, no drift).
 */
export function parseCapsuleTimestamp(iso: string): Date {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${iso}`);
  return d;
}

/** Format unlock_at for display: "Jan 6, 2026 at 12:00 AM" (local time). */
export function formatUnlockDateTime(iso: string): string {
  const d = parseCapsuleTimestamp(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Format date only: "Jan 6, 2026". */
export function formatUnlockDate(iso: string): string {
  const d = parseCapsuleTimestamp(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Format time only: "12:00 AM" (local). */
export function formatUnlockTime(iso: string): string {
  const d = parseCapsuleTimestamp(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
}

/** Format created_at for display. */
export function formatCreatedDate(iso: string): string {
  const d = parseCapsuleTimestamp(iso);
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}
