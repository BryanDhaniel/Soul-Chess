arg NODE_VERSION=24-alpine


## Dependencies
from node:${NODE_VERSION} as dependencies
workdir /app

copy package*.json ./

# install only deps not including devDeps with frozen lockfile and cleaning cache
run --mount=type=cache,target=/root/.npm \
  if [ -f package-lock.json ]; then \
    npm ci && npm cache clean --force; \
  else \
    echo "No lockfile found." && exit 1; \
  fi



## Build
from node:${NODE_VERSION} as builder
workdir /app

copy --from=dependencies /app/node_modules ./node_modules

copy . .

env NODE_ENV=production
env NEXT_TELEMETRY_DISABLED=1

run if [ -f package-lock.json ]; then \
    npm run build; \
  else \
    echo "No lockfile found." && exit 1; \
  fi



## Runner
from node:${NODE_VERSION} as runner
workdir /app

env NODE_ENV=production
env PORT=3000
env HOSTNAME="0.0.0.0"

copy --from=builder --chown=node:node /app/public ./public
run mkdir .next
run chown node:node .next

copy --from=builder --chown=node:node /app/.next/standalone ./
copy --from=builder --chown=node:node /app/.next/static ./.next/static

user node

expose 3000

cmd ["node", "server.js"]
