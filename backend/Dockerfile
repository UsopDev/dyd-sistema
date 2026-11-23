FROM node:22-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

COPY . .

RUN DATABASE_URL="postgresql://root:postgres@localhost:5432/dyd_db?schema=public" npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
