const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import your models
const Ticket = require('./models/Ticket');
const SensorData = require('./models/SensorData');
// (Import User, Challenge, Proposal, Message here too)

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json()); // Essential for parsing incoming JSON data

// --- 1. DATABASE CONNECTION ---
mongoose.connect('mongodb://127.0.0.1:27017/nagrik_nova')
  .then(() => console.log('✅ MongoDB Connected locally'))
  .catch(err => console.error('❌ MongoDB Error:', err));


// --- 2. ESSENTIAL APIs ---

// COMPLAINTS / TICKETS
app.post('/api/complaints', async (req, res) => {
  const newTicket = new Ticket(req.body);
  await newTicket.save();
  res.json({ message: 'Complaint created', ticket: newTicket });
});

app.get('/api/tickets', async (req, res) => {
  const tickets = await Ticket.find();
  res.json(tickets);
});

app.get('/api/tickets/:id', async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  res.json(ticket);
});

app.put('/api/tickets/:id', async (req, res) => {
  const updatedTicket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ message: 'Ticket updated', ticket: updatedTicket });
});

// SENSOR DATA
app.post('/api/sensor-data', async (req, res) => {
  const newData = new SensorData(req.body);
  await newData.save();
  res.json({ message: 'Sensor data stored', data: newData });
});

app.get('/api/sensor-data', async (req, res) => {
  const data = await SensorData.find();
  res.json(data);
});

// Placeholder for remaining routes (Challenges, Proposals, Messages)
app.post('/api/challenges', (req, res) => res.send('POST /challenges working'));
app.get('/api/challenges', (req, res) => res.send('GET /challenges working'));
app.post('/api/proposals', (req, res) => res.send('POST /proposals working'));
app.get('/api/proposals', (req, res) => res.send('GET /proposals working'));
app.post('/api/messages', (req, res) => res.send('POST /messages working'));
app.get('/api/messages', (req, res) => res.send('GET /messages working'));


// --- 3. START SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 Prototype Server running on http://localhost:${PORT}`);
});