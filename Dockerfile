FROM node:22-alpine AS build-stage

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run app


FROM nginx:alpine AS serve-stage

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-stage /app/app /usr/share/nginx/html

EXPOSE 80
