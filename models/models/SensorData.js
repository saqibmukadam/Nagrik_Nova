const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  sensorType: { type: String, required: true }, // e.g., 'water-level'
  reading: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SensorData', sensorDataSchema);