import * as core from '@actions/core'
import * as github from '@actions/github'

import type {AssignReviewersReturn} from '../types'

import {getYamlConfigAsync} from '../utils/getYamlConfigAsync'
import {parseConfig} from '../utils/parseConfig'
import {getContextPullRequestDetails} from '../utils/getContextPullRequestDetails'
import {assignReviewersAsync} from '../utils/assignReviewersAsync'
import {unassignReviewersAsync} from '../utils/unassignReviewersAsync'
import {getConfigFromUrl} from '../utils/getConfigFromUrlAsync'
import {isValidUrl} from '../utils/isValidUrl'

import {Config} from '../config'

/**
 * Assign and/or unassign reviewers using labels.
 *
 * @returns {Promise<void>}
 */
export async function run(): Promise<void> {
  try {
    const client = github.getOctokit(
      core.getInput('repo-token', {required: true})
    )
    const configFilePath = core.getInput('config-file', {required: true})
    const unassignIfLabelRemoved = core.getInput('unassign-if-label-removed', {
      required: false
    })

    const contextDetails = getContextPullRequestDetails()

    if (contextDetails == null) {
      throw new Error('No context details')
    }

    let userConfig: Config | null

    if (isValidUrl(configFilePath)) {
      core.debug('🔗 Retrieving config from url...')
      const configRequestHeaders =
        core.getInput('config-request-headers', {required: false}) ?? '{}'

      core.debug(`Using headers for url... ${JSON.parse(configRequestHeaders)}`)

      userConfig = await getConfigFromUrl<Config>(
        configFilePath,
        contextDetails.baseSha,
        JSON.parse(configRequestHeaders)
      )
    } else {
      core.debug('📄 Retrieving config from yaml file...')
      userConfig = await getYamlConfigAsync<Config>(
        client,
        contextDetails.baseSha,
        configFilePath
      )
    }

    if (userConfig == null) {
      throw new Error('Failed to load config file')
    }

    core.debug(`Using config - ${JSON.stringify(userConfig)}`)

    const config = parseConfig(userConfig)

    const contextPayload = github.context.payload

    core.debug('Assigning reviewers...')

    const assignedResult = await assignReviewersAsync({
      client,
      contextDetails,
      contextPayload,
      labelReviewers: config.assign
    })

    if (assignedResult.status === 'error') {
      core.setFailed(assignedResult.message)
      return
    }

    core.debug(`${assignedResult.status} - ${assignedResult.message}`)

    if (unassignIfLabelRemoved) {
      core.debug('Unassigning reviewers...')

      const unassignedResult = await unassignReviewersAsync({
        client,
        contextDetails: {
          labels: contextDetails.labels,
          baseSha: contextDetails.baseSha,
          reviewers: [
            ...new Set([
              ...contextDetails.reviewers,
              ...(assignedResult.data?.reviewers ?? [])
            ])
          ]
        },
        contextPayload,
        labelReviewers: config.assign
      })

      if (unassignedResult.status === 'error') {
        core.setFailed(unassignedResult.message)
        return
      }

      setResultOutput('unassigned', unassignedResult)
      core.debug(`${unassignedResult.status} - ${unassignedResult.message}`)
    } else {
      setResultOutput('unassigned', {
        status: 'info',
        message: 'Skip unassigning reviewers'
      })
    }

    setResultOutput('assigned', assignedResult)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

function setResultOutput(
  assignType: 'unassigned' | 'assigned',
  result: AssignReviewersReturn
): void {
  core.setOutput(`${assignType}_status`, result.status)
  core.setOutput(`${assignType}_message`, result.message)
  core.setOutput(`${assignType}_url`, result.data?.url)
  core.setOutput(`${assignType}_reviewers`, result.data?.reviewers)
}
