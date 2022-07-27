import yaml from 'js-yaml'
import * as github from '@actions/github'

import type {Client} from '../types'

/**
 * Retrieve the file contents from a github repo.
 *
 * @param {Client} client - The github client.
 * @param {string} ref - The name of the commit/branch/tag.
 * @param {string} contentPath - The path to the file.
 * @returns {Promise<string>}
 * The contents of the file.
 */
async function getFileContents(
  client: Client,
  ref: string,
  contentPath: string
): Promise<string> {
  const result = await client.rest.repos.getContent({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    path: contentPath,
    ref
  })

  if (result.status !== 200) {
    throw new Error(`Failed ${result.status} ${ref.slice(0, 7)} ${contentPath}`)
  }

  const data = result.data as typeof result['data'] & {content?: string}

  if (!data.content) {
    throw new Error(`No content ${ref.slice(0, 7)} ${contentPath}`)
  }

  return Buffer.from(data.content, 'base64').toString()
}

/**
 * Retrieve the yaml config from a path.
 *
 * @param {Client} client - The github client.
 * @param {string} ref - The name of the commit/branch/tag.
 * @param {string} contentPath - The path to the file.
 * @returns {Promise<TConfig | void>}
 * The contents of the yaml config
 */
async function getYamlConfigAsync<TConfig>(
  client: Client,
  ref: string,
  contentPath: string
): Promise<TConfig | void> {
  try {
    const contents = await getFileContents(client, ref, contentPath)
    return yaml.load(contents, {filename: contentPath}) as TConfig
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to load configuration ${ref.slice(0, 7)} ${
          error.message
        } ${contentPath}`
      )
    }
  }
}

export default getYamlConfigAsync
