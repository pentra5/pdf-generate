FROM ghcr.io/puppeteer/puppeteer:23.4.0

# Working directory
WORKDIR /usr/src/app

# Puppeteer config (Chromium already included)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium-browser"

# Install deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app code
COPY . .

# Use non-root puppeteer user
USER pptruser

EXPOSE 3000
CMD ["node", "index.js"]
