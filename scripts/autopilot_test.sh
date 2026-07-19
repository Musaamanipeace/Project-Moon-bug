#!/bin/bash
set -e

# Validation gate for the Moonbug build. Runs the REAL test suite against the
# application modules (lunar math, auth, streak computation) inside the backend
# module. Replace this with your own CI gate as needed.
echo "Running Moonbug validation suite..."
cd "$(dirname "$0")/.."
( cd backend && go test -v -race -coverprofile=coverage.out ./test/... )

echo "Validation metrics satisfied. Proceeding with automated operational pipeline."
