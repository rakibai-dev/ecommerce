# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
# Multi-source COPY into ./prisma trips containerd buildkit ("cannot copy to
# non-directory"); keep manifest files and the schema in separate COPYs.
COPY package.json package-lock.json ./
COPY prisma ./prisma
# npm ci runs @prisma/client's postinstall, which auto-generates the client
# because the schema is already present at /app/prisma/schema.prisma.
RUN npm ci
# Explicit (idempotent) generate so the build stage doesn't redo it silently.
RUN npx prisma generate

FROM deps AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV STANDALONE=1
# No DB reads happen at build time: every DB read sits behind a <Suspense>
# boundary (cacheComponents streams it at request time), so no DATABASE_URL
# point to a live database needed in the build stage.
RUN npm run build

# --- Runtime: Next.js standalone output ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
