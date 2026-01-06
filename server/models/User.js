const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Gunakan email sebagai satu-satunya identitas unik
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true 
  },
  password: { type: String, required: true }
});

module.exports = mongoose.model('User', userSchema);