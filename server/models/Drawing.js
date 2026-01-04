const mongoose = require('mongoose');

const DrawingSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  data: { type: String, required: true }, // Hum canvas ka base64 data ya strokes save karenge
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Drawing', DrawingSchema);