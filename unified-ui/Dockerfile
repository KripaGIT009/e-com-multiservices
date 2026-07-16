# Stage 1: Build Angular
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps --ignore-scripts
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve with Node (Express BFF)
FROM node:20-alpine AS runner
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --legacy-peer-deps --ignore-scripts
COPY server.js ./
COPY --from=builder /app/dist ./dist
EXPOSE 4200
CMD ["node", "server.js"]
