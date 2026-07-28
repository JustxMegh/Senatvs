const mongoose = require('mongoose');

const depositoSchema = new mongoose.Schema({
  depositoName: { type: String, required: true, unique: true },
  items: [{
    name: { type: String, required: true },
    quantity: { type: Number, default: 0 }
  }]
});

module.exports = mongoose.model('Deposito', depositoSchema);
