const mongoose = require('mongoose');

// Get the default connection
const db = mongoose.connection;
// Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
const { Schema } = mongoose;
const userDiscountSchema = new Schema({
  phone: { type: String, required: true },
  discountCode: { type: String, required: true },
}, {
  collection: 'userDiscount',
  timestamps: true,
});

module.exports = mongoose.model('UserDiscount', userDiscountSchema);
