const mongoose = require('mongoose');

const furtoSchema = new mongoose.Schema({
  executorId: { type: String, required: true },
  taggedUser: { type: String, required: true },
  items: [{
    name: { type: String, required: true },
    quantity: { type: Number, required: true }
  }],
  soldiSporchiAmount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Furto', furtoSchema);
