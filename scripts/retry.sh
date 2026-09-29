#!/usr/bin/env bash
# Runs a command until it succeeds, doubling the delay after each failure.
# Usage: scripts/retry.sh <attempts> <initial-delay-seconds> <command> [args...]
# Emits GitHub Actions ::warning:: / ::error:: annotations and exits non-zero
# with the command's last exit code when every attempt fails.
set -uo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <attempts> <initial-delay-seconds> <command> [args...]" >&2
  exit 2
fi

attempts=$1
delay=$2
shift 2

if ! [[ $attempts =~ ^[1-9][0-9]*$ && $delay =~ ^[0-9]+$ ]]; then
  echo "attempts must be a positive integer and delay a non-negative integer" >&2
  exit 2
fi

for ((attempt = 1; attempt <= attempts; attempt++)); do
  "$@"
  status=$?

  if [[ $status -eq 0 ]]; then
    exit 0
  fi

  if [[ $attempt -lt $attempts ]]; then
    echo "::warning::Attempt ${attempt}/${attempts} failed (exit ${status}): $*. Retrying in ${delay}s."
    sleep "$delay"
    delay=$((delay * 2))
  fi
done

echo "::error::All ${attempts} attempts failed (exit ${status}): $*"
exit "$status"
