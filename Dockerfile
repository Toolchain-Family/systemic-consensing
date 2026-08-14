# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# App wird unter dem Toolchain-Subpfad serviert (entspricht vite base '/Tools/SysConsens/')
COPY --from=build /app/dist /usr/share/nginx/html/Tools/SysConsens
EXPOSE 80
