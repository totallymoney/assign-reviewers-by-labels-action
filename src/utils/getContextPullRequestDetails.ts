import * as github from '@actions/github'

import type {GithubLabel, GithubReviewer} from '../types'

export type ContextPullRequestDetails = Return

interface Return {
  labels: string[]
  reviewers: string[]
}

function getContextPullRequestDetails(): Return | null {
  const pullRequest = github.context.payload.pull_request

  if (typeof pullRequest === 'undefined') {
    return null
  }

  const labels = pullRequest.labels as GithubLabel[]
  const reviewers = pullRequest.requested_reviewers as GithubReviewer[]

  return {
    labels: labels.map(label => label.name),
    reviewers: reviewers.map(reviewer => reviewer.login)
  }
}

export default getContextPullRequestDetails
