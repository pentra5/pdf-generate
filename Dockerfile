FROM ghcr.io/puppeteer/puppeteer:latest

# Set working directory
WORKDIR /usr/src/app

# Skip Chromium download (using bundled version)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app
COPY . .

# Expose port
EXPOSE 3000

# Run as non-root user
USER pptruser

# Start app
CMD ["node", "index.js"]
