const mongoose = require('mongoose');

const campoSchema = new mongoose.Schema({
  sessionNumber: { type: Number, required: true, unique: true },
  status: { type: String, enum: ['ACTIVE', 'COMPLETED'], default: 'ACTIVE' },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  participants: [{
    userId: { type: String, required: true },
    weaponGiven: { type: String, default: null },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date, default: null },
    accumulatedSeconds: { type: Number, default: 0 },
    manualAdjustmentMinutes: { type: Number, default: 0 },
    kills: { type: Number, default: 0 },
    isCurrentlyActive: { type: Boolean, default: true }
  }],
  outcome: { type: String, enum: ['WON', 'LOST', null], default: null },
  weaponsLost: { type: Number, default: 0 },
  opponentFaction: { type: String, default: null },
  loot: [{
    category: { type: String, enum: ['weapons', 'bullets', 'drugs'] },
    name: { type: String },
    quantity: { type: Number }
  }]
});

module.exports = mongoose.model('Campo', campoSchema);
