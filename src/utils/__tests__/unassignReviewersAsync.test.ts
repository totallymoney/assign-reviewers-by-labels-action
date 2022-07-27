import {describe, it, expect, afterEach, vi} from 'vitest'

import {unassignReviewersAsync} from '../unassignReviewersAsync'
import * as setReviewersAsyncFn from '../setReviewersAsync'
import {Client} from '../../types'

const mockClient = {} as unknown as Client

describe('unassignReviewersAsync', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should unassign reviewer when there are no labels', async () => {
    const spy = vi
      .spyOn(setReviewersAsyncFn, 'setReviewersAsync')
      .mockImplementationOnce(() =>
        Promise.resolve({
          url: 'mock-url'
        })
      )

    const result = await unassignReviewersAsync({
      client: mockClient,
      contextDetails: {
        labels: [],
        reviewers: ['reviewer1']
      },
      labelReviewers: {
        test: ['reviewer1'],
        test1: ['reviewer1']
      },
      contextPayload: {}
    })

    expect(result).toEqual({
      status: 'success',
      message: 'Reviewers have been unassigned',
      data: {
        url: 'mock-url',
        reviewers: ['reviewer1']
      }
    })

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should unassign reviewers from labels that have been removed', async () => {
    const spy = vi
      .spyOn(setReviewersAsyncFn, 'setReviewersAsync')
      .mockImplementationOnce(() =>
        Promise.resolve({
          url: 'mock-url'
        })
      )

    const result = await unassignReviewersAsync({
      client: mockClient,
      contextDetails: {
        labels: ['test'],
        reviewers: ['reviewer1', 'reviewer2', 'reviewer3']
      },
      labelReviewers: {
        test: ['reviewer1'],
        test1: ['reviewer1', 'reviewer2', 'reviewer3']
      },
      contextPayload: {}
    })

    expect(result).toEqual({
      status: 'success',
      message: 'Reviewers have been unassigned',
      data: {
        url: 'mock-url',
        reviewers: ['reviewer2', 'reviewer3']
      }
    })

    expect(spy).toHaveBeenCalledTimes(1)
  })
})
