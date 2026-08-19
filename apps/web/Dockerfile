# بیلد وب Next.js (خروجی standalone)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
COPY packages/engine/package.json packages/engine/package.json
COPY packages/games/backgammon/package.json packages/games/backgammon/package.json
COPY packages/games/chess/package.json packages/games/chess/package.json
COPY packages/games/tic-tac-toe/package.json packages/games/tic-tac-toe/package.json
COPY packages/games/vegas/package.json packages/games/vegas/package.json
RUN npm ci --workspaces --if-present || npm install --workspaces

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build:packages && npm run build -w @bazigb/web

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
