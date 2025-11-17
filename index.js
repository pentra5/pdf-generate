const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer-core");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

async function findChrome() {
  const paths = [
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable"
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

app.post("/convert", async (req, res) => {
  const { html, filename = "file.pdf" } = req.body;

  if (!html) {
    return res.status(400).json({ error: "No HTML content provided" });
  }

  let browser;

  try {
    const chromePath =
      process.env.PUPPETEER_EXECUTABLE_PATH || (await findChrome());

    console.log(">> Chrome Detected:", chromePath);

    if (!chromePath) {
      throw new Error("Chrome executable NOT FOUND in container");
    }

    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--allow-file-access",
        "--allow-file-access-from-files",
        "--disable-web-security",
        "--single-process",
        "--no-zygote"
      ]
    });

    const page = await browser.newPage();

    console.log(">> Setting HTML content...");
    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 60000
    });

    console.log(">> Creating PDF...");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true
    });

    console.log(">> PDF Generated. Size:", pdf.length, "bytes");

    // DEBUG MODE: write to container
    fs.writeFileSync("/tmp/test.pdf", pdf);
    console.log(">> PDF saved to /tmp/test.pdf");

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(pdf);

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
});
