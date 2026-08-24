const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['citizen', 'municipality', 'admin'], default: 'citizen' }
});

module.exports = mongoose.model('User', userSchema);