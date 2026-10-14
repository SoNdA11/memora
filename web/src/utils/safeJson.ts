/** Safely parse a JSON-encoded array. Returns [] on any failure. */
export function safeParseArray<T>(value: string | null | undefined): T[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

/** Safely parse a JSON-encoded array of strings (e.g. tags). */
export function safeParseStringArray(value: string | null | undefined): string[] {
  return safeParseArray<string>(value).filter((v): v is string => typeof v === 'string')
}
