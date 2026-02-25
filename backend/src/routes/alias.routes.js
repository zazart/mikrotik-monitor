const express = require('express');
const router = express.Router();
const Alias = require('../models/alias.model');

// GET - tous les alias
router.get('/', async (req, res) => {
  try {
    const aliases = await Alias.find();
    res.json(aliases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - créer ou mettre à jour un alias
router.post('/', async (req, res) => {
  try {
    const { mac, name } = req.body;
    const alias = await Alias.findOneAndUpdate(
      { mac },
      { mac, name, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(alias);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - supprimer un alias
router.delete('/:mac', async (req, res) => {
  try {
    await Alias.findOneAndDelete({ mac: req.params.mac });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;