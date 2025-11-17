const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer-core");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Chrome PDF Service Running",
    chromePath: process.env.PUPPETEER_EXECUTABLE_PATH
  });
});

app.post("/convert", async (req, res) => {
  const { html, filename = "file.pdf" } = req.body;

  if (!html) {
    return res.status(400).json({ error: "No HTML content provided" });
  }

  let browser;

  try {
    const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH;

    console.log("Launching Chromium at:", chromePath);

    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--single-process",
        "--no-zygote",
        "--disable-dev-shm-usage"
      ]
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdf);

  } catch (err) {
    console.error("❌ PDF ERROR:", err);

    if (browser) await browser.close();

    return res.status(500).json({
      error: "Failed to generate PDF",
      detail: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 PDF Service running on port ${PORT}`);
  console.log("Chromium Path:", process.env.PUPPETEER_EXECUTABLE_PATH);
});
