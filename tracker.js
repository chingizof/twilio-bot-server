/* eslint-disable no-console */
const mongoose = require('mongoose');

// Set up default mongoose connection
const mongoDB = 'mongodb+srv://nurlan:qweQWE123@cluster0.ikiuf.mongodb.net/test?retryWrites=true&w=majority';
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

// Get the default connection
const db = mongoose.connection;

// Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const UserDiscount = require('./db/models/UserDiscount');
const msgCtrl = require('./controllers/msg');
const {
  getAbandonedCart,
} = require('./cartAbandonment');

const storeAPIkey = 'a55e9f8e5d6feebd23752396acd80cc4';
const storePassword = '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';
const storeMyShopify = 'banarasi-outfit.myshopify.com';

const apiVersion = '2021-04';

setInterval(() => {
  getAbandonedCart(
    storeMyShopify,
    apiVersion,
    storeAPIkey,
    storePassword,
  )
    .then((response) => {
      if (!response) {
        return;
      }

      const allCarts = response.data.checkouts;
      if (!allCarts || !allCarts.length) {
        console.log('abandoned carts not found');
        return;
      }
      console.log(allCarts.map((x) => ({ discount_codes: x.discount_codes[0].code })));
      UserDiscount.find((err, pairs) => {
        if (!pairs || !pairs.length) {
          console.log('phone:discount pairs not found');
          return;
        }
        allCarts.forEach((cart) => {
          for (let i = 0; i < cart.discount_codes.length; i += 1) {
            const { code } = cart.discount_codes[i];
            const findedPair = pairs.find((p) => p.discountCode === code);
            if (!findedPair) return;
            console.log(`found pairs: ${findedPair.phone}: ${findedPair.discountCode}`);
            msgCtrl.sendMsg({
              fromNumber: findedPair.phone,
              msg: `Hi! Come back & finish your purchase! Here's the link:\n${cart.abandoned_checkout_url}`,
            });
            return;
          }
        });
        // eslint-disable-next-line consistent-return
        return pairs;
      });
    });
}, 3000);
