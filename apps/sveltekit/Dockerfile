# Runtime-only image. Build on the host first: `npm ci && npm run build` (scripts/build-all.sh).
# adapter-node bundles everything in devDependencies, so build/ is self-contained.
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY package.json ./
COPY build ./build
EXPOSE 3000
CMD ["node", "build"]
