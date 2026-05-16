# ==========================================
# STAGE 1: Build the Frontend Application
# ==========================================
FROM node:24.15.0-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# ==========================================
# STAGE 2: Serve with Nginx 
# ==========================================

FROM nginxinc/nginx-unprivileged:alpine

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=build /app/dist/mp-app/browser /usr/share/nginx/html

CMD ["nginx", "-c", "/etc/nginx/nginx.conf", "-g", "daemon off;"]
