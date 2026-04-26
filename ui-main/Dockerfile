# ─── Stage 1: Build customer Angular SPA (ui-storefront) ─────────────────────
FROM node:18-alpine AS customer-build
WORKDIR /build
COPY ui-storefront/package*.json ./
RUN npm install --silent
COPY ui-storefront/ .
# Use explicit --output-path so we always know where the build lands.
# The Angular 'application' builder places browser files at {output-path}/browser/
RUN npx ng build --configuration=production --output-path=dist/customer-out

# ─── Stage 2: Build admin Angular SPA (ui-admin) with /admin/ base-href ──────
FROM node:18-alpine AS admin-build
WORKDIR /build
COPY ui-admin/package*.json ./
RUN npm install --silent
COPY ui-admin/ .
# --base-href sets <base href="/admin/"> in index.html so Angular Router and
# all asset URLs resolve correctly when the app is served under /admin/
RUN npx ng build --configuration=production --base-href=/admin/ --output-path=dist/admin-out

# ─── Stage 3: Unified Node.js BFF ────────────────────────────────────────────
FROM node:18-alpine
WORKDIR /app

# Server dependencies
COPY ui-main/package*.json ./
RUN npm ci --only=production

# Server code
COPY ui-main/server.js .

# Customer Angular build  →  dist/customer/
# (application builder places browser files at {output-path}/browser/)
COPY --from=customer-build /build/dist/customer-out/browser ./dist/customer

# Admin Angular build     →  dist/admin/
# (built with --base-href /admin/ so it serves correctly at /admin/)
COPY --from=admin-build /build/dist/admin-out/browser ./dist/admin

EXPOSE 4200
CMD ["node", "server.js"]
