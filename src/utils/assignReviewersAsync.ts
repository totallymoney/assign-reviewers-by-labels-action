import type {WebhookPayload} from '@actions/github/lib/interfaces'
import type {Config} from '../config'
import type {AssignReviewersReturn, Client} from '../types'
import type {ContextPullRequestDetails} from './getContextPullRequestDetails'
import {setReviewersAsync} from './setReviewersAsync'

interface Options {
  client: Client
  labelReviewers: Config['assign']
  contextDetails: ContextPullRequestDetails
  contextPayload: WebhookPayload
}

/**
 * Determine the reviewers that should be
 * added depending on the state of the PR. Then,
 * request to add those reviewers to the PR.
 *
 * @param {Options} options
 * @returns {Promise<AssignReviewersReturn>}
 * The status of whether the reviewers were assigned
 * as well as data containing those reviewers.
 */
export async function assignReviewersAsync({
  client,
  labelReviewers,
  contextDetails,
  contextPayload
}: Options): Promise<AssignReviewersReturn> {
  if (contextDetails == null) {
    return {
      status: 'error',
      message: 'No action context'
    }
  }

  const labels = Object.keys(labelReviewers)
  const reviewersByLabels: string[] = []

  for (const label of labels) {
    if (contextDetails.labels.includes(label)) {
      reviewersByLabels.push(...labelReviewers[label])
    }
  }

  const reviewersToAssign = [...new Set(reviewersByLabels)]

  if (reviewersToAssign.length === 0) {
    return {
      status: 'info',
      message: 'No reviewers to assign from the labels provided'
    }
  }

  const diffNewReviewers = reviewersToAssign.filter(
    reviewer => !contextDetails.reviewers.includes(reviewer)
  )

  if (diffNewReviewers.length === 0) {
    return {
      status: 'info',
      message: 'No new reviewers to assign'
    }
  }

  const result = await setReviewersAsync({
    client,
    reviewers: reviewersToAssign,
    contextPayload,
    action: 'assign'
  })

  if (result == null) {
    return {
      status: 'info',
      message: 'No reviewers to assign'
    }
  }

  return {
    status: 'success',
    message: 'Reviewers have been assigned',
    data: {url: result.url, reviewers: reviewersToAssign}
  }
}
