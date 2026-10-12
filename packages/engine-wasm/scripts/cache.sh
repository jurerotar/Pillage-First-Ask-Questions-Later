#!/usr/bin/env bash

# Cache both the inputs and outputs: deleted or damaged artifacts must rebuild.
cache_valid() {
  local stage=$1 key=$2
  shift 2
  local stamp=".cache/$stage.sha256"
  [ -f "$stamp" ] && [ "$(head -n 1 "$stamp")" = "$key" ] || return 1
  local output
  for output in "$@"; do
    [ -f "$output" ] || return 1
  done
  [ "$(tail -n +2 "$stamp")" = "$(sha256sum "$@")" ]
}

cache_run() {
  local stage=$1 key=$2
  shift 2
  local outputs=()
  while [ "$1" != '--' ]; do
    outputs+=("$1")
    shift
  done
  shift
  if cache_valid "$stage" "$key" "${outputs[@]}"; then
    echo "Cached $stage"
    return
  fi
  echo "Building $stage"
  "$@" || return "$?"
  mkdir -p .cache
  local stamp=".cache/$stage.sha256" temporary=".cache/$stage.$$.tmp"
  # Commit only successful stages. Failed commands never authorize reuse.
  { printf '%s\n' "$key"; sha256sum "${outputs[@]}"; } > "$temporary"
  mv "$temporary" "$stamp"
}

cache_key() {
  local identity=$1
  shift
  { printf '%s\n' "$identity"; sha256sum "$@"; } | sha256sum | cut -d ' ' -f 1
}
