import * as github from '@actions/github'

export type Client = ReturnType<typeof github.getOctokit>

export interface GithubLabel {
  /**
   * The name of the label
   */
  name: string
}

export interface GithubReviewer {
  /**
   * The login for the user.
   */
  login: string
}

export type ReviewerStatus = 'success' | 'error' | 'info'

export interface AssignReviewersReturn {
  /**
   * The status of the assignment.
   */
  status: ReviewerStatus
  /**
   * Additional information about the action.
   */
  message: string
  /**
   * The url and the list of reviewers that are
   * assigned/unassigned.
   */
  data?: {url: string; reviewers: string[]}
}
