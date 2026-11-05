# Stage 1 - build
FROM node:26-alpine@sha256:40cd011b55415bc894e45b02fdd5a5dfde056921b7d23a64c74f80497af48797 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2 - serve
FROM nginx:1.31-alpine@sha256:785835ea65db4bba6f021acc0f3be91b0fef76a53fe41f8588c6698d2aed0606
# The base still ships brotli-libs 1.2.0, open to CVE-2026-111497.
# Drop this line once nginx:1.31-alpine carries 1.2.1.
RUN apk add --no-cache 'brotli-libs>=1.2.1-r0'
COPY --from=build /app/dist/my-vinyl/browser /usr/share/nginx/html
EXPOSE 80
