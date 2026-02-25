const mongoose = require('mongoose');

const aliasSchema = new mongoose.Schema({
  mac: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alias', aliasSchema);