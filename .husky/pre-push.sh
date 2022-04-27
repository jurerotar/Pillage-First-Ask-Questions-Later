#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

currentBranch=`git rev-parse --abbrev-ref HEAD`
branchRegex="^(build|chore|ci|docs|hotfix|feat|fix|perf|refactor|style|test|release|revert)/([A-Z]+-[0-9]+-.*|\d+)$"

if [[ ! $currentBranch =~ $branchRegex ]]; then
  printf 'The current branch name is invalid. Consult CONTRIBUTING.md for the naming convention.'
  exit 1
fi
