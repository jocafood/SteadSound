FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY index.html sound.js vite.config.mjs ./
COPY frontend ./frontend
COPY audio ./audio
ARG VITE_SOUND_PROFILE=ensemble
ENV VITE_SOUND_PROFILE=$VITE_SOUND_PROFILE
RUN npm run build

FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
