const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer-core");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

// ======== FIND CHROME / CHROMIUM AUTO ========
function findChrome() {
  const paths = [
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chrome"
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      console.log(">> Chrome Detected:", p);
      return p;
    }
  }

  throw new Error("Chromium / Chrome not found in container");
}

// ======== ROOT ENDPOINT ========
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "PDF Generator Service Running",
    chromePath: "auto"
  });
});

// ======== PDF CONVERTER ========
app.post("/convert", async (req, res) => {
  const { html, filename = "file.pdf" } = req.body;

  if (!html) {
    return res.status(400).json({ error: "No HTML content provided" });
  }

  let browser;

  try {
    // Find Chrome in container
    const chromePath = findChrome();

    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process"
      ]
    });

    const page = await browser.newPage();

    console.log(">> Setting HTML content...");
    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 60000
    });

    console.log(">> Creating PDF...");
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    console.log(">> PDF Generated. Size:", pdfBuffer.length);

    await browser.close();

    // FIX UTAMA — pastikan binary mode
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length,
    });

    return res.end(pdfBuffer, "binary");

  } catch (err) {
    if (browser) await browser.close();
    console.error("PDF ERROR:", err.message);

    return res.status(500).json({
      error: "Failed to generate PDF",
      detail: err.message,
    });
  }
});

// ======== START SERVER ========
app.listen(PORT, () => {
  console.log(`🚀 PDF Service running on port ${PORT}`);
});
