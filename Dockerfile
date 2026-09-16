FROM node:22-alpine AS frontend

WORKDIR /app/e-cormeci
COPY e-cormeci/package*.json ./
RUN npm ci
COPY e-cormeci/ ./
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY server.js ./
COPY --from=frontend /app/e-cormeci/dist ./e-cormeci/dist
COPY e-cormeci/database ./e-cormeci/database

EXPOSE 3001
CMD ["node", "server.js"]