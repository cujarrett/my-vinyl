# Stage 1 - build
FROM node:26-alpine@sha256:7ed4edf2b680417bf06d3f465de09bb113f877ff265b15f72a27a4c6fb76fb04 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2 - serve
# The platform base image already carries Alpine's security fixes.
FROM ghcr.io/cujarrett/base-spa:nginx1.31-alpine@sha256:a5e096d54c04b6543c25e45b26334e3a2f8533b571bf50e0dd02b66fb7c4e84a
COPY --from=build /app/dist/my-vinyl/browser /usr/share/nginx/html
EXPOSE 80
