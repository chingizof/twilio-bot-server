const axios = require('axios');

async function getAbandonedCart(
  storeMyShopify,
  apiVersion,
  storeAPIkey,
  storePassword,
) {
  const urlCheckouts = `https://${storeAPIkey}:${storePassword}@${storeMyShopify}/admin/api/${apiVersion}/checkouts.json`;

  return axios
    .get(urlCheckouts, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((response) => response)
    .catch((error) => {
      // handle error
      console.log('@@@@@@@@@@ERROR at getAbandonedCart:   ', error);
      return false;
    });
}

exports.getAbandonedCart = getAbandonedCart;
module.exports = exports;
