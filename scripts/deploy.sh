#!/usr/bin/env bash
set -euo pipefail

ENV=${ENV:-${1:-}}
if [[ -z "$ENV" ]]; then
  echo "Usage: $0 ENV" >&2
  exit 1
fi

case "$ENV" in
  develop|qa|prod)
    ;;
  *)
    echo "Unknown environment: $ENV" >&2
    exit 1
    ;;
esac

TAG=${TAG:-$ENV}
REGISTRY=${REGISTRY:-ghcr.io/your-org}

COMPOSE_FILE="docker-compose.deploy.yml"
if [[ -f "docker-compose.deploy.${ENV}.yml" ]]; then
  COMPOSE_FILE="docker-compose.deploy.${ENV}.yml"
fi

export TAG REGISTRY ENV

echo "Deploying ${ENV} with images ${REGISTRY}/mesabos-*:${TAG}"

docker compose -f "${COMPOSE_FILE}" pull

docker compose -f "${COMPOSE_FILE}" up -d
