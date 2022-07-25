import {describe, it, expect, afterEach, vi} from 'vitest'

import {unassignReviewersAsync} from '../unassignReviewersAsync'
import * as setReviewersAsyncFn from '../setReviewersAsync'

const mockClient = {} as any

describe('unassignReviewersAsync', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should unassign reviewers from labels that have been removed', async () => {
    const spy = vi
      .spyOn(setReviewersAsyncFn, 'setReviewersAsync')
      .mockImplementationOnce(
        () =>
          Promise.resolve({
            url: 'mock-url'
          }) as any
      )

    const result = await unassignReviewersAsync({
      client: mockClient,
      contextDetails: {
        labels: ['test'],
        reviewers: ['reviewer1', 'reviewer2', 'reviewer3', 'reviewer4']
      },
      labelReviewers: {
        test: ['reviewer1', 'reviewer2'],
        test1: ['reviewer3']
      },
      contextPayload: {}
    })

    expect(result).toEqual({
      status: 'success',
      message: 'Reviewers have been unassigned',
      data: {
        url: 'mock-url',
        reviewers: ['reviewer3']
      }
    })

    expect(spy).toHaveBeenCalledTimes(1)
  })
})
