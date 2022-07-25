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

  const reviewersByLabelMiss = Object.keys(labelReviewers)
    .filter(label => !contextDetails.labels.includes(label))
    .reduce<string[]>((reviewers, label) => {
      return reviewers.concat(labelReviewers[label])
    }, [])

  if (reviewersByLabelMiss.length === 0) {
    return {
      message: 'No reviewers to unassign',
      status: 'info'
    }
  }

  const reviewersDupeCount = reviewersByLabelMiss.reduce(
    (all: Record<string, number>, reviewer) => {
      all[reviewer] = (all[reviewer] || 0) + 1
      return all
    },
    {}
  )

  const reviewersToUnassign = Object.keys(reviewersDupeCount).filter(
    reviewer => {
      return (
        reviewersDupeCount[reviewer] === 1 &&
        contextDetails.reviewers.includes(reviewer)
      )
    }
  )

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
      message: 'Failed to unassign reviewers'
    }
  }

  return {
    status: 'success',
    message: 'Reviewers have been unassigned',
    data: {url: result.url, reviewers: reviewersToUnassign}
  }
}
