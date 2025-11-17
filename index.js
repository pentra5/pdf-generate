const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Puppeteer PDF Service is running!',
    endpoints: {
      health: 'GET /',
      convert: 'POST /convert'
    }
  });
});

// Convert HTML to PDF
app.post('/convert', async (req, res) => {
  let browser;
  
  try {
    const { html, filename = 'document.pdf', options = {} } = req.body;
    
    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }
    
    console.log('Starting PDF conversion...');
    
    // Launch browser - FIX INI!
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions'
      ],
      // TAMBAH INI: Auto-detect Chrome path
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 
                      puppeteer.executablePath()
    });
    
    const page = await browser.newPage();
    
    await page.setContent(html, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 30000
    });
    
    const pdfOptions = {
      format: options.format || 'A4',
      printBackground: options.printBackground !== false,
      margin: options.margin || {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },
      preferCSSPageSize: true
    };
    
    const pdfBuffer = await page.pdf(pdfOptions);
    
    await browser.close();
    
    console.log('PDF generated successfully');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    if (browser) {
      await browser.close();
    }
    
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Puppeteer PDF Service running on port ${PORT}`);
});