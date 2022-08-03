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
    const json: TConfig = await response.json()
    return json
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to load configuration ${ref.slice(0, 7)} ${
          error.message
        } ${configUrl}`
      )
    }
    return null
  }
}
