import {describe, it, expect, beforeAll, afterAll} from 'vitest'
import {rest} from 'msw'
import {setupServer} from 'msw/node'

import {getConfigFromUrlAsync} from '../getConfigFromUrlAsync'
import {Config} from '../../config'

const mockUrl = 'http://localhost:8080'

describe('getConfigFromUrlAsync', () => {
  const server = setupServer(
    rest.get(`${mockUrl}/success`, (req, res, ctx) => {
      if (req.headers.get('test') !== 'header') {
        return res(ctx.status(403))
      }

      return res(
        ctx.json({
          assign: {
            test: ['reviewer1', 'reviewer2']
          }
        })
      )
    }),
    rest.get(`${mockUrl}/500`, (req, res, ctx) => {
      return res(ctx.status(500))
    }),
    rest.get(`${mockUrl}/invalid-format`, (req, res, ctx) => {
      return res(ctx.text('text'))
    })
  )

  beforeAll(() => {
    server.listen()
  })

  afterAll(() => {
    server.close()
  })

  it('should return the json response', async () => {
    const response = await getConfigFromUrlAsync<Config>(
      `${mockUrl}/success`,
      'test-ref',
      {
        test: 'header'
      }
    )

    expect(response).toEqual({
      assign: {
        test: ['reviewer1', 'reviewer2']
      }
    })
  })

  it('should throw an error if the response throws a 500', async () => {
    const mock500Url = `${mockUrl}/500`
    await expect(() => {
      return getConfigFromUrlAsync<Config>(mock500Url, 'test-ref', {
        test: 'header'
      })
    }).rejects.toThrowError(
      `Failed to load configuration for sha "test-ref" - Response status (500) from ${mock500Url}`
    )
  })

  it('should throw an error if the response is not json', async () => {
    const mock500Url = `${mockUrl}/invalid-format`
    await expect(() => {
      return getConfigFromUrlAsync<Config>(mock500Url, 'test-ref', {
        test: 'header'
      })
    }).rejects.toThrowError(
      `Failed to load configuration for sha "test-ref" - invalid json response body at ${mock500Url}`
    )
  })
})
