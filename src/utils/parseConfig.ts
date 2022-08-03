import {ZodError} from 'zod'
import {Config, ConfigSchema} from '../config'

/**
 * Validate and parse the config so it can be
 * used by the application.
 *
 * @param {unknown} config - The potential
 * config file for the action.
 * @returns {Config}
 * The parsed config file for the action.
 */
export function parseConfig(config: unknown): Config {
  try {
    if (ConfigSchema.parse(config)) {
      const parsedConfig = config as Config
      parsedConfig.assign = dedupeLabelReviewers({...parsedConfig.assign})
      return parsedConfig
    }
    return config as Config
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = error as ZodError<typeof ConfigSchema>
      throw new Error(validationError.errors[0].message)
    }
    throw new Error('Failed to parse the config')
  }
}

/**
 * Scrub the list of reviewers for each label so its a unique list of
 * reviewers.
 *
 * @param {Config['assign']} assign - The assign object which contains the
 * labels and the list of reviewers for each label.
 * @returns {Config['assign']}
 * The assign object with each label containing the unique list of reviewers.
 */
function dedupeLabelReviewers(assign: Config['assign']): Config['assign'] {
  return Object.keys(assign).reduce<Config['assign']>((parsed, label) => {
    parsed[label] = [...new Set(assign[label])]
    return parsed
  }, {})
}
