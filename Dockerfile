FROM node:alpine

# Set the working directory
WORKDIR /app

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install cloudflared
RUN apk add --no-cache curl && \
    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared && \
    chmod +x /usr/local/bin/cloudflared

# Copy package.json and package-lock.json for Express app
COPY /package*.json ./

# Install dependencies for the Express app
RUN npm install

# Copy the Express app
COPY . .

EXPOSE 3000

# Add cloudflared command
RUN echo $'#!/bin/sh\n\
cloudflared access tcp --hostname proxy.marketa.id --url localhost:8082 &\n\
node api.js' > entrypoint.sh \
    && chmod +x entrypoint.sh

# Start command using entrypoint script
CMD ["sh", "entrypoint.sh"]