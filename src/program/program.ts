import * as core from '@actions/core'
import github from '@actions/github'

import type {Config} from '../types'

import getYamlConfigAsync from '../utils/getYamlConfigAsync'
import parseConfig from '../utils/parseConfig'
import getContextPullRequestDetails from '../utils/getContextPullRequestDetails'
import {assignReviewersAsync} from '../utils/assignReviewersAsync'
import {unassignReviewersAsync} from '../utils/unassignReviewersAsync'

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
      github.context.payload.pull_request?.base?.sha,
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

      core.setOutput('unassigned_status', unassignedResult.status)
      core.setOutput('unassigned_message', unassignedResult.message)
      core.setOutput('unassigned_url', unassignedResult.data?.url)

      core.debug(`${unassignedResult.status} - ${unassignedResult.message}`)
    }

    core.setOutput('assigned_status', assignedResult.status)
    core.setOutput('assigned_message', assignedResult.message)
    core.setOutput('assigned_url', assignedResult.data?.url)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}
