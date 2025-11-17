FROM ghcr.io/puppeteer/puppeteer:23.4.0

# Paksa Node.js versi modern
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    node -v && npm -v

WORKDIR /usr/src/app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

USER pptruser

CMD ["node", "index.js"]
