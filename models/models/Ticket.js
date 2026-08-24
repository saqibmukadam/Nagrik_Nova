const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: { 
    type: String, 
    default: () => 'TKT-' + Math.floor(1000 + Math.random() * 9000) // Auto-generates ID like TKT-4921
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, default: 'open' }
});

module.exports = mongoose.model('Ticket', ticketSchema);