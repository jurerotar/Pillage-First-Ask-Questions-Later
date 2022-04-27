#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

commitMessage=`cat $1`
commitMessageRegex="^(build|ci|docs|feat|chore|fix|perf|refactor|style|test|revert)\(.*\):.*$"
