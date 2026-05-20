FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn prisma:generate && yarn build

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
EXPOSE 3001
CMD ["node", "dist/index.js"]
