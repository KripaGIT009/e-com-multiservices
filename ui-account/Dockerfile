# Build Angular app
FROM node:18-alpine AS angular-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Run Node.js BFF
FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY server.js .
COPY .env* ./
COPY --from=angular-build /app/dist ./dist

EXPOSE 4203

CMD ["node", "server.js"]
