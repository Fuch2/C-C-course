FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/runner/package.json apps/runner/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/course-engine/package.json packages/course-engine/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN npm ci --ignore-scripts --no-fund
COPY apps/runner apps/runner
COPY packages/shared packages/shared
RUN node node_modules/typescript/bin/tsc -p apps/runner/tsconfig.build.json

FROM docker:28-cli AS docker-cli
FROM node:22-bookworm-slim
WORKDIR /app
COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=build /app/apps/runner/dist ./
COPY --from=build /app/node_modules/zod ./node_modules/zod
COPY package.json ./package.json
ENV NODE_ENV=production RUNNER_HOST=0.0.0.0 RUNNER_PORT=4001
EXPOSE 4001
CMD ["node", "apps/runner/src/index.js"]
