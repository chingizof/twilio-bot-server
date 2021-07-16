const { getConnect } = require('./db/mongo');
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

      const client = getConnect();
      client.connect((connecionError) => {
        if (connecionError) {
          console.log(connecionError);
          return;
        }
        const db = client.db('test');
        const discounts = db.collection('discounts');
        discounts.find({}).then((pairs) => {
          if (!pairs || !pairs.length) {
            console.log('phone:discount pairs not found');
            return;
          }
          allCarts.forEach((cart) => {
            for (let i = 0; i < cart.discount_codes.length; i += 1) {
              const code = cart.discount_codes[i];
              const findedPair = pairs.find((p) => p.discountCode === code);
              if (!findedPair) return;
              msgCtrl.sendMsg({
                fromNumber: findedPair.phone,
                msg: `Please, complete your purchase!\n${cart.abandoned_checkout_url}`,
              });
              return;
            }
          });
        }).catch((err) => {
          console.log(err);
        });
      });
    });
}, 3000);
