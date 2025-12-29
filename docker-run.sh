#!/bin/bash

docker run -d \
  --name kdesk-support-app \
  --restart unless-stopped \
  -p 8081:8081 \
  -e EXPO_PUBLIC_RORK_DB_ENDPOINT="${EXPO_PUBLIC_RORK_DB_ENDPOINT}" \
  -e EXPO_PUBLIC_RORK_DB_NAMESPACE="${EXPO_PUBLIC_RORK_DB_NAMESPACE}" \
  -e EXPO_PUBLIC_RORK_DB_TOKEN="${EXPO_PUBLIC_RORK_DB_TOKEN}" \
  -e EXPO_PUBLIC_RORK_API_BASE_URL="${EXPO_PUBLIC_RORK_API_BASE_URL:-}" \
  -e EXPO_PUBLIC_TOOLKIT_URL="${EXPO_PUBLIC_TOOLKIT_URL:-}" \
  -e EXPO_PUBLIC_PROJECT_ID="${EXPO_PUBLIC_PROJECT_ID:-q0sa2c9vj7fqop2ycox77}" \
  -e EXPO_PUBLIC_TEAM_ID="${EXPO_PUBLIC_TEAM_ID:-}" \
  kdesk-support-app:latest

echo "Container started. Access the app at http://localhost:8081"
