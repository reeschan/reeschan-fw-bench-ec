# Runtime-only image. Build on the host first: `npm ci && npm run build` (scripts/build-all.sh).
# Nitro bundles server deps into .output, so node_modules is not needed at runtime.
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY .output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
