import {describe, it, expect, afterEach, vi} from 'vitest'

import {assignReviewersAsync} from '../assignReviewersAsync'
import * as setReviewersAsyncFn from '../setReviewersAsync'

const mockClient = {} as any

describe('assignReviewersAsync', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should assign a list of reviewers from the label reviewers', async () => {
    const spy = vi
      .spyOn(setReviewersAsyncFn, 'setReviewersAsync')
      .mockImplementationOnce(
        () =>
          Promise.resolve({
            url: 'mock-url'
          }) as any
      )

    const result = await assignReviewersAsync({
      client: mockClient,
      contextPayload: {},
      contextDetails: {labels: ['test', 'test1'], reviewers: ['reviewer1']},
      labelReviewers: {
        test: ['reviewer1', 'reviewer2'],
        test1: ['reviewer3']
      }
    })

    expect(result).toEqual({
      status: 'success',
      message: 'Reviewers have been assigned',
      data: {
        url: 'mock-url',
        reviewers: ['reviewer1', 'reviewer2', 'reviewer3']
      }
    })

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should return an error status if there are no context details', async () => {
    const spy = vi
      .spyOn(setReviewersAsyncFn, 'setReviewersAsync')
      .mockImplementationOnce(
        () =>
          Promise.resolve({
            url: 'mock-url'
          }) as any
      )

    const result = await assignReviewersAsync({
      client: mockClient,
      contextPayload: {},
      contextDetails: null as any,
      labelReviewers: {
        test: ['reviewer1', 'reviewer2'],
        test1: ['reviewer3']
      }
    })

    expect(result).toEqual({
      status: 'error',
      message: 'No action context'
    })

    expect(spy).toHaveBeenCalledTimes(0)
  })

  it('should return an info status if there are no reviewers to assign from the labels', async () => {
    const spy = vi
      .spyOn(setReviewersAsyncFn, 'setReviewersAsync')
      .mockImplementationOnce(
        () =>
          Promise.resolve({
            url: 'mock-url'
          }) as any
      )

    const result = await assignReviewersAsync({
      client: mockClient,
      contextPayload: {},
      contextDetails: {
        labels: ['test', 'test1'],
        reviewers: ['reviewer1', 'reviewer2', 'reviewer3']
      },
      labelReviewers: {
        test: ['reviewer1', 'reviewer2'],
        test1: ['reviewer3']
      }
    })

    expect(result).toEqual({
      status: 'info',
      message: 'No new reviewers to assign'
    })

    expect(spy).toHaveBeenCalledTimes(0)
  })

  it('should return an info status if reviewers could not be assigned', async () => {
    const spy = vi
      .spyOn(setReviewersAsyncFn, 'setReviewersAsync')
      .mockImplementationOnce(() => Promise.resolve(null))

    const result = await assignReviewersAsync({
      client: mockClient,
      contextPayload: {},
      contextDetails: {
        labels: ['test', 'test1'],
        reviewers: ['reviewer1', 'reviewer2']
      },
      labelReviewers: {
        test: ['reviewer1', 'reviewer2'],
        test1: ['reviewer3']
      }
    })

    expect(result).toEqual({
      status: 'info',
      message: 'No reviewers to assign'
    })

    expect(spy).toHaveBeenCalledTimes(1)
  })
})
