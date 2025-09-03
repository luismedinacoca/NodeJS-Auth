const mongoose = require('mongoose');
const ImagesSchema = new mongoose.Schema({
  url: {
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {timestamps: true});

module.exports = mongoose.model('Image', ImagesSchema);