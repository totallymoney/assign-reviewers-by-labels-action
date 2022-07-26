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

Create a workflow in your repository, you only need to trigger the workflow when a label has been added or removed:

#### Basic Workflow

```yml
name: "Pull Request Label Reviewers"
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
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
```

#### Advanced Workflow

```yml
name: "Pull Request Label Reviewers"
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
        id: assign_reviewers
        uses: ljbc1994/assign-reviewers-by-labels@v1
        with:
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
      - name: assigned reviewers
        if: steps.assign_reviewers.outputs.assigned_status == 'success'
        run: |
          echo "reviewers assigned: ${{ steps.reviewer.outputs.assigned_reviewers }}"
      - name: unassigned reviewers
        if: steps.assign_reviewers.outputs.unassigned_status == 'success'
        run: |
          echo "reviewers unassigned: ${{ steps.reviewer.outputs.unassigned_reviewers }}"
```

#### Action inputs

| Name | Description | Required | Default
| - | - | - | - | 
| `repo-token` | Token to use to authorize label changes. Typically the GITHUB_TOKEN secret, with `contents:read` and `pull-requests:write` access | `true` | N/A
| `unassign-if-label-removed` | Whether to unassign reviewers that belong to a label if the label has been removed  | `true` | `true`
| `config-file` | The path to the label configuration file | `false` | `.github/assign_label_reviewers.yml`

#### Action outputs

| Name | Description 
| - | - |
| `assigned_status` | Whether reviewers have been assigned (`success` / `info`) 
| `assigned_message` | Additional details of the status
| `assigned_url` | The url of the PR 
| `assigned_reviewers` | The reviewers that have been assigned
| `unassigned_status` | Whether reviewers have been unassigned (`success` / `info`) 
| `unassigned_message` | Additional details of the status
| `unassigned_url` | The url of the PR
| `unassigned_reviewers` | The reviewers that have been unassigned
