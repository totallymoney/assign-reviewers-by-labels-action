/**
 * Check whether the value is a valid url.
 *
 * @param {string} value - The potential url.
 * @returns {boolean}
 * Whether the value is a url and is valid
 */
export function isValidUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}
