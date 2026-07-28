const mongoose = require('mongoose');

const rapinaSchema = new mongoose.Schema({
  executorId: { type: String, required: true },
  taggedUsers: [{ type: String, required: true }],
  totalAmount: { type: Number, required: true },
  splitAmountPerUser: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Rapina', rapinaSchema);
