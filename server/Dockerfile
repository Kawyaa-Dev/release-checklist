# ---- Base image ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Install deps + generate Prisma client ----
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci && npx prisma generate

# ---- Copy source ----
COPY src ./src

# ---- Runtime ----
ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "src/index.js"]