import {produce} from 'immer'
import {describe, it, afterEach, vi, expect} from 'vitest'
import * as core from '@actions/core'
import * as github from '@actions/github'

import {run} from '../program'
import {Client} from '../../types'

vi.mock('@actions/core', () => {
  return {
    getInput: vi.fn(),
    setFailed: vi.fn(),
    setOutput: vi.fn(),
    debug: vi.fn()
  }
})

interface MockGithubContext {
  payload: typeof github.context['payload']
  repo: typeof github.context['repo']
}

const mockGithubContext: MockGithubContext = {
  payload: {
    pull_request: {
      base: {
        sha: 'test-sha'
      },
      labels: [{name: 'testlabel'}],
      requested_reviewers: [{login: 'reviewer1'}],
      number: 1,
      user: {
        login: 'test-user'
      }
    },
    repository: {
      name: 'test-repo',
      owner: {
        login: 'test-owner'
      },
      repo: 'test-repo'
    }
  },
  repo: {
    owner: 'test-owner',
    repo: 'test-repo'
  }
}

describe('main', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should assign new reviewers from the labels', async () => {
    const mockContext = produce(mockGithubContext, draftContext => {
      draftContext.payload.pull_request!.labels = [
        {name: 'testlabel'},
        {name: 'testlabel2'}
      ]
      draftContext.payload.pull_request!.requested_reviewers = []
    })

    const mockYaml = `
        assign: 
            testlabel: ['reviewer1', 'reviewer2']
            testlabel2: ['reviewer3', 'reviewer4']
    `

    // mock input options
    // @ts-ignore
    core.getInput.mockImplementation((input: string) => {
      switch (input) {
        case 'repo-token':
          return 'test-token'
        case 'config-file':
          return './mock.yml'
        case 'unassign-if-label-removed':
          return false
        default:
          return false
      }
    })

    vi.spyOn(github, 'context', 'get').mockReturnValue(
      mockContext as unknown as typeof github.context
    )

    const requestReviewersMock = vi.fn().mockResolvedValue({
      url: 'test-url-request'
    })

    const removeRequestedReviewersMock = vi.fn().mockResolvedValue({
      url: 'test-url-response'
    })

    vi.spyOn(github, 'getOctokit').mockReturnValue({
      rest: {
        repos: {
          getContent: vi.fn().mockResolvedValue({
            status: 200,
            data: {
              content: Buffer.from(mockYaml).toString('base64')
            }
          })
        },
        pulls: {
          requestReviewers: requestReviewersMock
        }
      }
    } as unknown as Client)

    await run()

    expect(requestReviewersMock).toHaveBeenCalledTimes(1)
    expect(requestReviewersMock).toHaveBeenNthCalledWith(1, {
      owner: 'test-owner',
      pull_number: 1,
      repo: 'test-repo',
      reviewers: ['reviewer1', 'reviewer2', 'reviewer3', 'reviewer4']
    })

    expect(removeRequestedReviewersMock).toHaveBeenCalledTimes(0)

    expect(core.setOutput).toHaveBeenCalledTimes(3)
    expect(core.setOutput).toHaveBeenNthCalledWith(
      1,
      'assigned_status',
      'success'
    )
    expect(core.setOutput).toHaveBeenNthCalledWith(
      2,
      'assigned_message',
      'Reviewers have been assigned'
    )
    expect(core.setOutput).toHaveBeenNthCalledWith(
      3,
      'assigned_url',
      'test-url-request'
    )
  })

  it('should unassign reviewers from the label', async () => {
    const mockContext = produce(mockGithubContext, draftContext => {
      draftContext.payload.pull_request!.labels = []
      draftContext.payload.pull_request!.requested_reviewers = [
        {login: 'reviewer1'},
        {login: 'reviewer2'}
      ]
    })

    const mockYaml = `
        assign: 
            testlabel: ['reviewer1', 'reviewer2']
    `

    // mock input options
    // @ts-ignore
    core.getInput.mockImplementation((input: string) => {
      switch (input) {
        case 'repo-token':
          return 'test-token'
        case 'config-file':
          return './mock.yml'
        case 'unassign-if-label-removed':
          return true
        default:
          return false
      }
    })

    vi.spyOn(github, 'context', 'get').mockReturnValue(
      mockContext as unknown as typeof github.context
    )

    const requestReviewersMock = vi.fn().mockResolvedValue({
      url: 'test-url-request'
    })

    const removeRequestedReviewersMock = vi.fn().mockResolvedValue({
      url: 'test-url-request'
    })

    vi.spyOn(github, 'getOctokit').mockReturnValue({
      rest: {
        repos: {
          getContent: vi.fn().mockResolvedValue({
            status: 200,
            data: {
              content: Buffer.from(mockYaml).toString('base64')
            }
          })
        },
        pulls: {
          requestReviewers: requestReviewersMock,
          removeRequestedReviewers: removeRequestedReviewersMock
        }
      }
    } as unknown as Client)

    await run()

    expect(requestReviewersMock).toHaveBeenCalledTimes(0)

    expect(removeRequestedReviewersMock).toHaveBeenCalledTimes(1)
    expect(removeRequestedReviewersMock).toHaveBeenNthCalledWith(1, {
      owner: 'test-owner',
      pull_number: 1,
      repo: 'test-repo',
      reviewers: ['reviewer1', 'reviewer2']
    })

    expect(core.setOutput).toHaveBeenCalledTimes(6)

    expect(core.setOutput).toHaveBeenNthCalledWith(
      1,
      'unassigned_status',
      'success'
    )
    expect(core.setOutput).toHaveBeenNthCalledWith(
      2,
      'unassigned_message',
      'Reviewers have been unassigned'
    )
    expect(core.setOutput).toHaveBeenNthCalledWith(
      3,
      'unassigned_url',
      'test-url-request'
    )
  })

  it('should assign new reviewers from the label and unassign reviewers from a removed label', async () => {
    const mockContext = produce(mockGithubContext, draftContext => {
      draftContext.payload.pull_request!.labels = [{name: 'testlabel'}]
      draftContext.payload.pull_request!.requested_reviewers = [
        {login: 'reviewer1'},
        {login: 'reviewer3'},
        {login: 'reviewer4'}
      ]
    })

    const mockYaml = `
        assign: 
            testlabel: ['reviewer1', 'reviewer2']
            testlabel2: ['reviewer3', 'reviewer4']
    `

    // mock input options
    // @ts-ignore
    core.getInput.mockImplementation((input: string) => {
      switch (input) {
        case 'repo-token':
          return 'test-token'
        case 'config-file':
          return './mock.yml'
        case 'unassign-if-label-removed':
          return true
        default:
          return false
      }
    })

    vi.spyOn(github, 'context', 'get').mockReturnValue(
      mockContext as unknown as typeof github.context
    )

    const requestReviewersMock = vi.fn().mockResolvedValue({
      url: 'test-url-request'
    })

    const removeRequestedReviewersMock = vi.fn().mockResolvedValue({
      url: 'test-url-request'
    })

    vi.spyOn(github, 'getOctokit').mockReturnValue({
      rest: {
        repos: {
          getContent: vi.fn().mockResolvedValue({
            status: 200,
            data: {
              content: Buffer.from(mockYaml).toString('base64')
            }
          })
        },
        pulls: {
          requestReviewers: requestReviewersMock,
          removeRequestedReviewers: removeRequestedReviewersMock
        }
      }
    } as unknown as Client)

    await run()

    expect(requestReviewersMock).toHaveBeenCalledTimes(1)
    expect(requestReviewersMock).toHaveBeenNthCalledWith(1, {
      owner: 'test-owner',
      pull_number: 1,
      repo: 'test-repo',
      reviewers: ['reviewer1', 'reviewer2']
    })

    expect(removeRequestedReviewersMock).toHaveBeenCalledTimes(1)
    expect(removeRequestedReviewersMock).toHaveBeenNthCalledWith(1, {
      owner: 'test-owner',
      pull_number: 1,
      repo: 'test-repo',
      reviewers: ['reviewer3', 'reviewer4']
    })

    expect(core.setOutput).toHaveBeenCalledTimes(6)
    expect(core.setOutput).toHaveBeenNthCalledWith(
      1,
      'unassigned_status',
      'success'
    )
    expect(core.setOutput).toHaveBeenNthCalledWith(
      2,
      'unassigned_message',
      'Reviewers have been unassigned'
    )
    expect(core.setOutput).toHaveBeenNthCalledWith(
      3,
      'unassigned_url',
      'test-url-request'
    )
    expect(core.setOutput).toHaveBeenNthCalledWith(
      4,
      'assigned_status',
      'success'
    )
    expect(core.setOutput).toHaveBeenNthCalledWith(
      5,
      'assigned_message',
      'Reviewers have been assigned'
    )
    expect(core.setOutput).toHaveBeenNthCalledWith(
      6,
      'assigned_url',
      'test-url-request'
    )
  })

  it('should error if there is no context details', async () => {
    const mockContext = produce(mockGithubContext, draftContext => {
      draftContext.payload.pull_request = undefined
    })

    // mock input options
    // @ts-ignore
    core.getInput.mockImplementation((input: string) => {
      switch (input) {
        case 'repo-token':
          return 'test-token'
        case 'config-file':
          return './mock.yml'
        case 'unassign-if-label-removed':
          return true
        default:
          return false
      }
    })

    vi.spyOn(github, 'context', 'get').mockReturnValue(
      mockContext as unknown as typeof github.context
    )

    await run()

    expect(core.setFailed).toHaveBeenCalledTimes(1)
    expect(core.setFailed).toHaveBeenNthCalledWith(1, 'No context details')
  })

  it('should return info status if there are no reviewers to assign', () => {})

  it('should error if the yaml config is invalid', async () => {})

  it('should error if the reviewers could not be assigned', async () => {})

  it('should error if the reviewers could not be unassigned', async () => {})
})
