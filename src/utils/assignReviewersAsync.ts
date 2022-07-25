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

  const reviewersByLabels = Object.keys(labelReviewers)
    .filter(label => contextDetails.labels.includes(label))
    .reduce<string[]>((reviewers, label) => {
      return reviewers.concat(labelReviewers[label])
    }, [])

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
