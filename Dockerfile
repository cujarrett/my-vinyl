# Stage 1 - build
FROM node:26-alpine@sha256:7ed4edf2b680417bf06d3f465de09bb113f877ff265b15f72a27a4c6fb76fb04 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2 - serve
FROM nginx:1.31-alpine@sha256:785835ea65db4bba6f021acc0f3be91b0fef76a53fe41f8588c6698d2aed0606
# The base image lags behind Alpine security fixes.
# Updating here clears those CVEs without waiting for nginx to rebuild.
RUN apk upgrade --no-cache
COPY --from=build /app/dist/my-vinyl/browser /usr/share/nginx/html
EXPOSE 80
