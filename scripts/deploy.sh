#!/usr/bin/env bash
set -euo pipefail

TAG=${TAG:-latest}
REGISTRY=${REGISTRY:-ghcr.io/your-org}

export TAG REGISTRY

echo "Deploying images ${REGISTRY}/mesabos-*:${TAG}"

docker compose -f docker-compose.deploy.yml pull

docker compose -f docker-compose.deploy.yml up -d
