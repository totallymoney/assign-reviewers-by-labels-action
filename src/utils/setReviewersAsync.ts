import {WebhookPayload} from '@actions/github/lib/interfaces'

import type {Client} from '../types'

interface Options {
  client: Client
  reviewers: string[]
  contextPayload: WebhookPayload
  action?: 'assign' | 'unassign'
}

export async function setReviewersAsync(
  options: Options
): Promise<{url: string} | null> {
  const payload = options.contextPayload
  const pullRequest = payload.pull_request
  const repository = payload.repository

  if (typeof pullRequest === 'undefined' || typeof repository === 'undefined') {
    throw new Error('Cannot resolve action context')
  }

  if (options.reviewers.length === 0) {
    return null
  }

  const repoOwner = repository.owner.login
  const pullNumber = pullRequest.number
  const repo = repository.name

  const prOwner = pullRequest.user.login

  const reviewers = options.reviewers.filter(reviewer => reviewer !== prOwner)

  if (reviewers.length === 0) {
    return null
  }

  const result =
    options.action === 'assign'
      ? await options.client.rest.pulls.requestReviewers({
          owner: repoOwner,
          repo,
          pull_number: pullNumber,
          reviewers
        })
      : await options.client.rest.pulls.removeRequestedReviewers({
          owner: repoOwner,
          repo,
          pull_number: pullNumber,
          reviewers
        })

  return {
    url: result.url
  }
}
