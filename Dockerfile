FROM node:alpine

# Set the working directory
WORKDIR /app

# Install system packages
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn \
    xvfb \
    x11vnc \
    xfce4 \
    xfce4-terminal \
    tigervnc \
    tigervnc-viewer \
    curl \
    supervisor

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install cloudflared
RUN apk add --no-cache curl && \
    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared && \
    chmod +x /usr/local/bin/cloudflared

# Copy package.json and package-lock.json for Express app
COPY package*.json ./

# Install dependencies for the Express app
RUN npm install

# Copy the Express app
COPY . .

# Set up VNC password
RUN mkdir ~/.vnc && \
    echo "your_password_here" | vncpasswd -f > ~/.vnc/passwd && \
    chmod 600 ~/.vnc/passwd

# Configure Supervisor
COPY supervisord.conf /etc/supervisord.conf

# Expose VNC port and the Express app port
EXPOSE 3000 5900

# Start supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
