const mongoose = require('mongoose');

const consumptionSchema = new mongoose.Schema({
  year:      { type: Number, required: true },
  month:     { type: Number, required: true },
  totalMB:   { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

consumptionSchema.index({ year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Consumption', consumptionSchema);
