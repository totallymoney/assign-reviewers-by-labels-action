import type {Config} from '../types'

function parseConfig(config: unknown): Config {
  if (config == null || typeof config !== 'object') {
    throw new Error('Config is not an object')
  }

  if (!config.hasOwnProperty('assign')) {
    throw new Error('Config must have a list of labels with reviewers')
  }

  const assign = (config as unknown as Config).assign

  if (typeof assign === 'string' || Array.isArray(assign)) {
    throw new Error('Assign must be an object with labels and reviewers')
  }

  const invalidLabels = Object.keys(assign)
    .filter(label => !Array.isArray(assign[label]))
    .map(label => label)

  if (invalidLabels.length > 0) {
    throw new Error(
      `${invalidLabels.join(' + ')} must have an array of reviewers`
    )
  }

  return config as Config
}

export default parseConfig
