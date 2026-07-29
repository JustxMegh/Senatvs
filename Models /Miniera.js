const mongoose = require('mongoose');

// Matches exactly what commands/miniera.js writes and what
// commands/management.js's /lista miniera reads back.
const minieraSchema = new mongoose.Schema({
  executorId: { type: String, required: true },
  // Flat object like { legno: 5, ferro: 3 } - keys/values vary per entry,
  // so Mixed is used instead of a fixed sub-schema.
  items: { type: mongoose.Schema.Types.Mixed, default: {} },
  totalItems: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Miniera', minieraSchema);
