const mongoose = require('mongoose');

const serverStatSchema = new mongoose.Schema({
  year:        { type: Number, required: true },
  month:       { type: Number, required: true },
  totalSeconds: { type: Number, default: 0 },
  updatedAt:   { type: Date, default: Date.now }
});

serverStatSchema.index({ year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('ServerStat', serverStatSchema);