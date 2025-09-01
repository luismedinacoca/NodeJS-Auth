const mongoose =  require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'], // it allows either 'user' or 'admin' roles only.
    default: 'user',
  }
}, {timestamps: true});

module.exports = mongoose.model('User', userSchema);