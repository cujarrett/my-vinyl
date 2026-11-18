# Stage 1 - build
FROM node:26-alpine@sha256:7ed4edf2b680417bf06d3f465de09bb113f877ff265b15f72a27a4c6fb76fb04 AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2 - serve
# The platform base image already carries Alpine's security fixes.
FROM ghcr.io/cujarrett/base-nginx:1.31-alpine@sha256:5a496bb0fc48c56667dd14b68390213f35380810ad3a36e1c632a7702990394a
COPY --from=build /app/dist/my-vinyl/browser /usr/share/nginx/html
EXPOSE 80
