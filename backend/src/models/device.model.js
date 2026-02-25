const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  mac: { type: String, required: true },
  interface: { type: String },        // wlan1 (2.4GHz) ou wlan2 (5GHz)
  uptime: { type: String },
  lastActivity: { type: Number },     // en secondes
  signalStrength: { type: Number },   // en dBm
  txRate: { type: String },
  rxRate: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Device', deviceSchema);