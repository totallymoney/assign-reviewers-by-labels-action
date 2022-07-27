import * as core from '@actions/core'
import * as github from '@actions/github'

import type {AssignReviewersReturn} from '../types'

import getYamlConfigAsync from '../utils/getYamlConfigAsync'
import parseConfig from '../utils/parseConfig'
import getContextPullRequestDetails from '../utils/getContextPullRequestDetails'
import {assignReviewersAsync} from '../utils/assignReviewersAsync'
import {unassignReviewersAsync} from '../utils/unassignReviewersAsync'
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

    const yamlConfig = await getYamlConfigAsync<Config>(
      client,
      contextDetails.baseSha,
      configFilePath
    )

    if (yamlConfig == null) {
      throw new Error('Failed to load config file')
    }

    const config = parseConfig(yamlConfig)

    const contextPayload = github.context.payload

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
      core.debug('Unassign reviewers')

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
