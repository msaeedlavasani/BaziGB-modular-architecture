# بیلد سرور NestJS
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/server/package.json apps/server/package.json
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
RUN npm run build:packages && npm run build -w @bazigb/server

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "apps/server/dist/main.js"]
