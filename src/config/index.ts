import z from 'zod'

export const ConfigSchema = z.object(
  {
    assign: z.record(
      z
        .array(
          z.string({
            required_error:
              '"reviewer" array must contain a valid reviewer or reviewers',
            invalid_type_error:
              '"reviewer" array must contain a valid reviewer or reviewers'
          }),
          {
            required_error:
              '"assign" labels must contain an array of reviewers',
            invalid_type_error:
              '"assign" labels must contain an array of reviewers'
          }
        )
        .min(1, '"assign" must have at least one reviewer'),
      {
        required_error:
          '"assign" must be an object with the label as the key and the reviewers as an array',
        invalid_type_error:
          '"assign" be an object with the label as the key and the reviewers as an array'
      }
    )
  },
  {
    required_error: 'Config must have an "assign" object of labels',
    invalid_type_error: 'Config must have an "assign" object of labels'
  }
)

export type Config = z.infer<typeof ConfigSchema>
