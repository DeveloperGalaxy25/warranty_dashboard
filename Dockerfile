FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
# Allow peer dependency conflicts during CI installs
RUN npm ci --legacy-peer-deps
# Copy the rest of the app (includes .env.production)
COPY . .
# Build static assets; Vite will read .env.production
RUN npm run build

FROM nginx:stable-alpine
# Copy build output
COPY --from=builder /app/dist /usr/share/nginx/html
# SPA fallback so client-side routes work
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
