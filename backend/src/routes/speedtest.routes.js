const express = require('express');
const router  = express.Router();
const speedTest = require('speedtest-net');

let cachedSpeed = null;
let lastTest    = null;

router.get('/run', async (req, res) => {
  try {
    console.log('🚀 Speedtest en cours...');
    const result = await speedTest({ acceptLicense: true, acceptGdpr: true });

    cachedSpeed = {
      download: (result.download.bandwidth / 125000).toFixed(2), // Mbps
      upload:   (result.upload.bandwidth   / 125000).toFixed(2), // Mbps
      ping:     result.ping.latency.toFixed(0),
      server:   result.server.name,
      testedAt: new Date()
    };
    lastTest = new Date();

    console.log(`✅ Speedtest : ↓${cachedSpeed.download} Mbps ↑${cachedSpeed.upload} Mbps`);
    res.json(cachedSpeed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/result', (req, res) => {
  if (!cachedSpeed) {
    return res.json({ message: 'Aucun speedtest effectué encore' });
  }
  res.json(cachedSpeed);
});

module.exports = router;