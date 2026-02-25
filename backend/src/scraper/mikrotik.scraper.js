const puppeteer = require('puppeteer');
const Device = require('../models/device.model');
const Consumption = require('../models/consumption.model');
const ServerStat  = require('../models/serverstat.model');

const MIKROTIK_URL  = process.env.MIKROTIK_URL;
const MIKROTIK_USER = process.env.MIKROTIK_USER;
const MIKROTIK_PASS = process.env.MIKROTIK_PASS;
const INTERVAL      = parseInt(process.env.SCRAPE_INTERVAL) || 1000;

async function startScraper(io) {
  console.log('🕷️  Démarrage du scraper Puppeteer...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    await page.goto(MIKROTIK_URL, { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('#name', { timeout: 10000 });
    await page.type('#name', MIKROTIK_USER);
    await page.type('#password', MIKROTIK_PASS);
    await page.click('#dologin');
    await page.waitForSelector('table.table', { timeout: 15000 });
    console.log('✅ Connecté à WebFig MikroTik');
  } catch (err) {
    console.error('❌ Erreur login:', err.message);
    await browser.close();
    return;
  }

  try {
    await page.goto(
      'http://192.168.88.1/webfig/#Wireless.Registration',
      { waitUntil: 'networkidle2', timeout: 15000 }
    );
    await page.waitForSelector('table.table tbody tr', { timeout: 15000 });
    console.log('✅ Page Registration chargée');
  } catch (err) {
    console.error('❌ Erreur navigation:', err.message);
    await browser.close();
    return;
  }

  console.log(`🔄 Scraping toutes les ${INTERVAL}ms...`);

  let scrapeCount = 0;
  let txBuffer    = 0;
  const MAX_INTERNET_MBPS = 192;

  setInterval(async () => {
    try {
      const devices = await page.evaluate(() => {
        const rows    = document.querySelectorAll('table.table tbody tr');
        const results = [];
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 12) {
            const mac = cells[3]?.innerText?.trim();
            if (mac && mac !== '') {
              results.push({
                mac,
                interface:      cells[4]?.innerText?.trim(),
                uptime:         cells[5]?.innerText?.trim(),
                lastActivity:   parseFloat(cells[8]?.innerText?.trim()) || 0,
                signalStrength: parseInt(cells[9]?.innerText?.trim())   || 0,
                txRate:         cells[10]?.innerText?.trim(),
                rxRate:         cells[11]?.innerText?.trim()
              });
            }
          }
        });
        return results;
      });

      if (devices.length === 0) {
        console.warn('⚠️  Aucun appareil trouvé');
        return;
      }

      const seconds = INTERVAL / 1000;
      const now     = new Date();
      const year    = now.getFullYear();
      const month   = now.getMonth() + 1;

      // ── Consommation réaliste ─────────────────────────────────
      scrapeCount++;
      const activeDevices = devices.filter(d => d.lastActivity < 2).length;
      const totalDevices  = devices.length || 1;
      const usageRatio    = activeDevices / totalDevices;
      const estimatedMbps = Math.min(MAX_INTERNET_MBPS * usageRatio * 0.3, MAX_INTERNET_MBPS);
      txBuffer += estimatedMbps;

      if (scrapeCount % 10 === 0) {
        const avgMbps = txBuffer / 10;
        const totalMB = (avgMbps * 10 * seconds) / 8;
        await Consumption.findOneAndUpdate(
          { year, month },
          { $inc: { totalMB }, updatedAt: now },
          { upsert: true }
        );
        txBuffer = 0;
      }

      // ── Uptime serveur ────────────────────────────────────────
      await ServerStat.findOneAndUpdate(
        { year, month },
        { $inc: { totalSeconds: seconds }, updatedAt: now },
        { upsert: true }
      );

      // ── Sauvegarder en MongoDB ────────────────────────────────
      devices.forEach(d => d.timestamp = now);
      await Device.insertMany(devices);

      // ── Émettre vers Angular ──────────────────────────────────
      io.emit('devices:update', devices);

      console.log(`📡 ${devices.length} appareil(s) scraped à ${now.toLocaleTimeString()}`);

    } catch (err) {
      console.error('❌ Erreur scraping:', err.message);
    }
  }, INTERVAL);
}

module.exports = { startScraper };