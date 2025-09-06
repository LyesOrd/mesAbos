#!/usr/bin/env bash
set -euo pipefail

TAG=${1:-${TAG:-latest}}
REGISTRY=${REGISTRY:-ghcr.io/your-org}

export TAG REGISTRY

echo "Deploying images ${REGISTRY}/mesabos-back:${TAG} and ${REGISTRY}/mesabos-front:${TAG}"

docker compose -f docker-compose.deploy.yml pull back front

docker compose -f docker-compose.deploy.yml up -d back front
