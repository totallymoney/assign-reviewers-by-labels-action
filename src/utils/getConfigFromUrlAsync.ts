import fetch from 'isomorphic-fetch'

export async function getConfigFromUrl<TConfig>(
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
