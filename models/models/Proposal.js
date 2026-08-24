const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
  submittedBy: { type: String, required: true }, // Name of the student/startup/university
  solutionText: { type: String, required: true },
  estimatedBudget: { type: Number },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Proposal', proposalSchema);