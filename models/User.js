const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' }, // 'admin' or 'user'
  mobile: { type: String, default: '' },
  gender: { type: String, default: '' },
  dob: { type: Date },
  location: { type: String, default: '' },
  alternateMobile: { type: String, default: '' },
  hintName: { type: String, default: '' },
  addresses: [{
    fullName: { type: String, default: '' },
    mobile: { type: String, default: '' },
    pincode: { type: String, default: '' },
    addressLine: { type: String, default: '' },
    locality: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    landmark: { type: String, default: '' },
    addressType: { type: String, enum: ['Home', 'Work'], default: 'Home' }
  }],
  notifications: [{
    message: String,
    date: { type: Date, default: Date.now }
  }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
