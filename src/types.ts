import * as github from '@actions/github'

export type Client = ReturnType<typeof github.getOctokit>

export interface GithubLabel {
  name: string
}

export interface GithubReviewer {
  login: string
}

export interface Config {
  assign: Record<string, string[]>
}

export type ReviewerStatus = 'success' | 'error' | 'info'

export interface AssignReviewersReturn {
  status: ReviewerStatus
  message: string
  data?: {url: string; reviewers: string[]}
}
