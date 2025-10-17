# --- Stage: 1 Build the app ---
FROM node:20-alpine AS base

WORKDIR /app

COPY package.json ./

RUN npm install -g pnpm

RUN pnpm install

COPY . .

RUN pnpm run build

# --- Stage 2: Serve app with nginx ---

FROM nginx:alpine

COPY --from=base /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
