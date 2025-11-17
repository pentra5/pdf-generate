# Base image resmi Puppeteer + Node.js 20 + Chromium
FROM ghcr.io/puppeteer/puppeteer:latest-node20

# Working directory
WORKDIR /usr/src/app

# Env variable agar puppeteer pakai chromium dari base image
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# Copy package.json & lock
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy seluruh project
COPY . .

# Expose app port
EXPOSE 3000

# Start
CMD ["node", "index.js"]
