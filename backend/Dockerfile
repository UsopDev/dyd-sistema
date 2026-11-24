FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npx prisma generate && rm -rf buildcache && npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
