# Runtime-only image. Build on the host first: `npm ci && npm run build` (scripts/build-all.sh).
# output: 'standalone' traces only the needed server files.
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY .next/standalone ./
COPY .next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
