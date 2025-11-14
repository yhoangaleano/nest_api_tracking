FROM node:18-alpine AS builder

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:18-alpine

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install --only=production

COPY --from=builder /usr/src/app/dist ./dist

# Accept ENTRY_FILE environment variable to choose between API and Worker modes
# Default: main (API mode with producer and consumer)
# Options: main.worker (Worker mode - only consumer)
ENV ENTRY_FILE=main

CMD ["sh", "-c", "node dist/${ENTRY_FILE}.js"]
