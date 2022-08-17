import fetch from 'isomorphic-fetch'

/**
 * Retrieve the config from the url.
 *
 * @param {string} configUrl - The url to retrieve the config from.
 * @param {string} ref - The name of the commit/branch/tag.
 * @param {Record<string, string>} headers - The request headers to add to the request.
 * @returns {Promise<TConfig | null>}
 * The json config from the url
 */
export async function getConfigFromUrlAsync<TConfig>(
  configUrl: string,
  ref: string,
  headers?: Record<string, string>
): Promise<TConfig | null> {
  try {
    const response = await fetch(configUrl, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        ...headers
      }
    })
    if (response.status >= 200 && response.status <= 299) {
      const json: TConfig = await response.json()
      return json
    }
    throw new Error(`Response status (${response.status}) from ${configUrl}`)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to load configuration for sha "${ref}" - ${error.message}`
      )
    }
    return null
  }
}
