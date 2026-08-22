FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY scripts ./scripts
RUN npm ci
COPY . .
EXPOSE 4000
ENV PORT=4000
CMD ["npm", "run", "dev"]
