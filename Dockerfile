FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget gnupg curl ca-certificates \
    fonts-liberation libasound2 libnss3 libxss1 libatk-bridge2.0-0 \
    libgtk-3-0 libxkbcommon0 libxcomposite1 libxcursor1 \
    libxdamage1 libxi6 libxtst6 libxrandr2 libcups2 \
    libxshmfence1 libgbm1 libpango-1.0-0 libpangocairo-1.0-0 \
    nodejs npm \
    --no-install-recommends

# Install Google Chrome Stable
RUN wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt-get install -y ./google-chrome-stable_current_amd64.deb \
    && rm google-chrome-stable_current_amd64.deb

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome"

EXPOSE 8080

CMD ["node", "index.js"]
