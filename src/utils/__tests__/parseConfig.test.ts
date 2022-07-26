import {describe, it, expect} from 'vitest'
import {Config} from '../../types'
import parseConfig from '../parseConfig'

describe('parseConfig', () => {
  it('should not throw an error if the config is valid', () => {
    const config: Config = {
      assign: {
        test1: ['reviewer1']
      }
    }

    expect(parseConfig(config)).toEqual(config)
  })

  it('should dedupe reviewers for the same label', () => {
    const config: Config = {
      assign: {
        test1: ['reviewer1', 'reviewer1'],
        tes21: ['reviewer2', 'reviewer2']
      }
    }

    expect(parseConfig(config)).toEqual({
      assign: {
        test1: ['reviewer1'],
        tes21: ['reviewer2']
      }
    })
  })

  it('should throw an error if no reviewers have been set for a label', () => {
    expect(() => parseConfig({assign: {test: null}})).toThrowError(
      'test must have an array of reviewers'
    )
  })

  it('should throw an error if there is no config', () => {
    expect(() => parseConfig(null)).toThrowError('Config is not an object')
  })

  it('should throw an error if there are no labels', () => {
    expect(() => parseConfig({})).toThrowError(
      'Config must have a list of labels with reviewers'
    )
  })
})
