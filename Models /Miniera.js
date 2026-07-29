const mongoose = require('mongoose');

const minieraSchema = new mongoose.Schema({
  executorId: { type: String, required: true },
  items: { type: Object, default: {} },
  totalItems: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  date: { type: Date, default: Date.now }
}, { strict: false });

module.exports = mongoose.model('Miniera', minieraSchema);
