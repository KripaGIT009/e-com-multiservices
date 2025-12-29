# Build Angular app
FROM node:18-alpine AS angular-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Run Node.js BFF
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY server.js .
COPY middleware ./middleware
COPY routes ./routes
COPY .env* ./
COPY --from=angular-build /app/dist/ui-admin/browser ./dist/ui-admin/browser
EXPOSE 3000
CMD ["npm", "start"]
