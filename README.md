# Github-review action

[![NPM](https://github.com/mobsuccess-devops/github-actions-review/actions/workflows/npm.yml/badge.svg)](https://github.com/mobsuccess-devops/github-actions-review/actions/workflows/npm.yml)

This action integrates GitHub with the #mobsuccess-review-requested Slack channel.

# Install the workflow in repository

To enable the workflow in your repository, add the following key in your `.mobsuccess.yml` file:

```yml
github-actions-review: true
```

The MS robot will automatically create a PR on your repository.
