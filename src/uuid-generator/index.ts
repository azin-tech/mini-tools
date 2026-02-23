export function generateUuid(options?: { count?: number }): { uuids: string[] } {
  const count = Math.max(1, options?.count ?? 1);
  return { uuids: Array.from({ length: count }, () => crypto.randomUUID()) };
}
