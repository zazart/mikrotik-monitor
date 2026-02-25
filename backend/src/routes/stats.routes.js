const express = require('express');
const router  = express.Router();
const Consumption = require('../models/consumption.model');
const ServerStat  = require('../models/serverstat.model');

router.get('/current', async (req, res) => {
  try {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth() + 1;

    const [consumption, serverStat] = await Promise.all([
      Consumption.findOne({ year, month }),
      ServerStat.findOne({ year, month })
    ]);

    const totalMB      = consumption ? consumption.totalMB     : 0;
    const totalSeconds = serverStat  ? serverStat.totalSeconds : 0;

    const hours   = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs    = Math.floor(totalSeconds % 60);
    const totalDays = (totalSeconds / 86400).toFixed(1);

    res.json({
      year,
      month,
      consumption: {
        totalMB: totalMB.toFixed(2),
        totalGB: (totalMB / 1024).toFixed(2)
      },
      uptime: {
        totalSeconds: Math.floor(totalSeconds),
        hours,
        minutes,
        secs,
        totalDays,
        formatted: `${hours}h ${minutes}m ${secs}s`
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;