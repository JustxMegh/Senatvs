const mongoose = require('mongoose');

const minieraSchema = new mongoose.Schema({
  executorId: { type: String, required: true },
  participants: { type: [String], default: [] }, // Lista degli ID dei partecipanti
  durationSeconds: { type: Number, default: 0 }, // Tempo trascorso in miniera
  items: { type: mongoose.Schema.Types.Mixed, default: {} },
  totalItems: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
}, { strict: false });

module.exports = mongoose.model('Miniera', minieraSchema);
