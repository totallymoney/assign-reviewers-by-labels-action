import {describe, it, expect} from 'vitest'
import parseConfig from '../parseConfig'

describe('parseConfig', () => {
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
