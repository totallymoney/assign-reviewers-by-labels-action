import type {WebhookPayload} from '@actions/github/lib/interfaces'
import type {AssignReviewersReturn, Client, Config} from '../types'
import type {ContextPullRequestDetails} from './getContextPullRequestDetails'
import {setReviewersAsync} from './setReviewersAsync'

interface Options {
  client: Client
  labelReviewers: Config['assign']
  contextDetails: ContextPullRequestDetails
  contextPayload: WebhookPayload
}

export async function unassignReviewersAsync({
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
  const reviewersByLabelMiss: string[] = []

  for (const label of labels) {
    if (!contextDetails.labels.includes(label)) {
      reviewersByLabelMiss.push(...labelReviewers[label])
    }
  }

  if (reviewersByLabelMiss.length === 0) {
    return {
      status: 'info',
      message: 'No reviewers to unassign'
    }
  }

  const reviewersDupeRecord: Record<string, number> = {}

  for (const label of labels) {
    const reviewers = labelReviewers[label]
    for (const reviewer of reviewers) {
      reviewersDupeRecord[reviewer] = (reviewersDupeRecord[reviewer] || 0) + 1
    }
  }

  const dupeRecordReviewers = Object.keys(reviewersDupeRecord)
  const reviewersToUnassign: string[] = []

  if (contextDetails.labels.length === 0) {
    reviewersToUnassign.push(...dupeRecordReviewers)
  } else {
    for (const reviewer of dupeRecordReviewers) {
      if (
        reviewersDupeRecord[reviewer] === 1 &&
        contextDetails.reviewers.includes(reviewer)
      ) {
        reviewersToUnassign.push(reviewer)
      }
    }
  }

  if (reviewersToUnassign.length === 0) {
    return {
      status: 'info',
      message: 'No reviewers to unassign'
    }
  }

  const result = await setReviewersAsync({
    client,
    reviewers: reviewersToUnassign,
    contextPayload,
    action: 'unassign'
  })

  if (result == null) {
    return {
      status: 'info',
      message: 'No reviewers to unassign'
    }
  }

  return {
    status: 'success',
    message: 'Reviewers have been unassigned',
    data: {url: result.url, reviewers: reviewersToUnassign}
  }
}
