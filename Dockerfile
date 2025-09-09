FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
# Allow peer dependency conflicts during CI installs
RUN npm ci --legacy-peer-deps
# Copy the rest of the app (includes .env.production)
COPY . .
# Build-time vars for Vite
ARG VITE_SHEETS_API_BASE
ARG VITE_SHEETS_API_TOKEN
ENV VITE_SHEETS_API_BASE=${VITE_SHEETS_API_BASE}
ENV VITE_SHEETS_API_TOKEN=${VITE_SHEETS_API_TOKEN}
# Build static assets; Vite will read envs above or .env.production
RUN echo "Building with VITE_SHEETS_API_BASE=$VITE_SHEETS_API_BASE" && npm run build

FROM nginx:stable-alpine
# Copy build output
COPY --from=builder /app/dist /usr/share/nginx/html
# SPA fallback so client-side routes work
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
