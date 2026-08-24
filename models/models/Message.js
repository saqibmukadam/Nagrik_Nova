const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // Using a simple string for the prototype (e.g., "Municipality Admin")
  receiver: { type: String, required: true }, // e.g., "Team Nagrik Nova"
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);