FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY scripts ./scripts
RUN npm ci
COPY . .
# `npm run dev` only starts server.js — it never compiles react-entries/*.tsx
# into public/react/*.js. Without this, every source change is silently
# inert: the container keeps serving whichever bundle happened to exist at
# image-build time.
RUN npm run build
EXPOSE 4000
ENV PORT=4000
CMD ["npm", "run", "dev"]
