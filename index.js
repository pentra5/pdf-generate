const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({
    status: "OK",
    message: "Puppeteer PDF Service Running",
    chromePath: process.env.PUPPETEER_EXECUTABLE_PATH
  });
});

app.post('/convert', async (req, res) => {
  const { html, filename = "document.pdf", options = {} } = req.body;

  if (!html) {
    return res.status(400).json({ error: "HTML content is required" });
  }

  let browser;

  try {
    console.log("Launching Chromium:", process.env.PUPPETEER_EXECUTABLE_PATH);

    browser = await puppeteer.launch({
      headless: "new",
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    const pdfBuffer = await page.pdf({
      format: options.format || "A4",
      printBackground: true,
      margin: options.margin || {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm"
      }
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error("❌ Error generating PDF:", error);

    if (browser) await browser.close();

    res.status(500).json({
      error: "Failed to generate PDF",
      detail: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 PDF generator running on port ${PORT}`);
});
