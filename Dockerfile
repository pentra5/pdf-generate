# Gunakan image resmi Puppeteer yang sudah include Node.js 20 + Chromium
FROM ghcr.io/puppeteer/puppeteer:23.4.0-node20

# Set working directory
WORKDIR /usr/src/app

# Copy file package.json & package-lock.json
COPY package*.json ./

# Install dependency tanpa devDependencies
RUN npm ci --omit=dev

# Copy semua source code
COPY . .

# Environment biar pupppeteer pakai chromium yang sudah ada di base image
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# Expose port (opsional, tergantung aplikasinya)
EXPOSE 3000

# Jalankan aplikasi
CMD ["node", "index.js"]
