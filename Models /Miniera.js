const mongoose = require('mongoose');

const minieraSchema = new mongoose.Schema({
  // Global Mineral Stockpile Singleton Document (ID: "GLOBAL_STOCKPILE")
  isGlobalStockpile: { type: Boolean, default: false },
  stockpile: {
    Legno: { type: Number, default: 0 },
    Pietra: { type: Number, default: 0 },
    Carbone: { type: Number, default: 0 },
    Ferro: { type: Number, default: 0 },
    Argento: { type: Number, default: 0 },
    Rubino: { type: Number, default: 0 },
    Oro: { type: Number, default: 0 },
    Smeraldo: { type: Number, default: 0 },
    Diamante: { type: Number, default: 0 }
  },
  // Bank Balance
  bankBalance: { type: Number, default: 0 },
  // Active/Most Recent Miniera Session
  activeSession: {
    status: { type: String, enum: ['ACTIVE', 'COMPLETED'], default: 'COMPLETED' },
    startTime: { type: Date },
    endTime: { type: Date },
    participants: [{
      userId: { type: String, required: true },
      joinedAt: { type: Date, default: Date.now },
      leftAt: { type: Date, default: null },
      accumulatedSeconds: { type: Number, default: 0 },
      manualAdjustmentMinutes: { type: Number, default: 0 },
      isCurrentlyActive: { type: Boolean, default: true }
    }]
  }
});

module.exports = mongoose.model('Miniera', minieraSchema);
