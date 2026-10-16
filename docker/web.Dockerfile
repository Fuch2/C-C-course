FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/runner/package.json apps/runner/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/course-engine/package.json packages/course-engine/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY prisma prisma
RUN npm ci --no-fund && node node_modules/prisma/build/index.js generate

FROM dependencies AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim AS web
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000 DATABASE_URL=file:/data/course.db CONTENT_ROOT=/app/content/cpp-systems
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 course && useradd --uid 10001 --gid 10001 --no-create-home course
COPY --from=build --chown=10001:10001 /app/apps/web/.next/standalone ./
COPY --from=build --chown=10001:10001 /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=10001:10001 /app/apps/web/public ./apps/web/public
COPY --from=build --chown=10001:10001 /app/content ./content
COPY --from=build --chown=10001:10001 /app/prisma ./prisma
USER 10001:10001
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

FROM dependencies AS init
COPY scripts/docker-init.mjs scripts/docker-init.mjs
ENV DATABASE_URL=file:/data/course.db
CMD ["node", "scripts/docker-init.mjs"]
