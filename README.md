# Assign Reviewers By Labels

Automatically assign reviewers to pull requests using labels.

## Usage

### Add a `.github/assign_label_reviewers.yml` file

To assign reviewers using labels, provide an object with the **key as the label** and the **value as an array of reviewers**.

```yml
assign:
  login: ['ljbc1994', 'reviewer2', 'reviewer3']
  signup: ['reviewer4', 'reviewer5']
  dashboard: ['ljbc1994', 'reviewer6']
```

### Create Workflow

Create a workflow in your repository

```yml
name: "Pull Request Labeler"
on:
  pull_request:
    types:
      - unlabeled
      - labeled

jobs:
  assign_and_unassign:
    name: assign and unassign reviewers
    runs-on: ubuntu-latest
    steps:
      - name: main
        id: assign-reviewers
        uses: ljbc1994/assign-reviewers-by-labels@v1
        with:
          unassign-if-label-removed: 'true'
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
```
