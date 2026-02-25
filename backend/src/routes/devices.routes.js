const express = require('express');
const router = express.Router();
const Device = require('../models/device.model');

// GET - dernière snapshot de tous les appareils connectés
router.get('/current', async (req, res) => {
  try {
    // Pour chaque MAC unique, on prend le document le plus récent
    const latest = await Device.aggregate([
      { $sort: { timestamp: -1 } },
      { $group: { _id: '$mac', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } }
    ]);
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - historique d'une adresse MAC
router.get('/history/:mac', async (req, res) => {
  try {
    const history = await Device.find({ mac: req.params.mac })
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;