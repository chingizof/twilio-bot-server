/* eslint-disable no-console */
const axios = require('axios');

// this initialize func to be called just once for each store when they first buy saletastic
async function shopifyStoreDiscountsInitialize(
  storeMyShopify,
  apiVersion,
  storeAPIkey,
  storePassword,
  discountPercent,
) {
  const dataPriceRule = {
    price_rule: {
      title: 'saletastic-cart-abd-discount',
      target_type: 'line_item',
      target_selection: 'all',
      allocation_method: 'across',
      value_type: 'percentage',
      value: discountPercent,
      customer_selection: 'all',
      once_per_customer: true,
      starts_at: '2021-07-09',
      usage_limit: '1',
    },
  };
  const sessionUrlPriceRule = `https://${storeMyShopify}/admin/api/${apiVersion}/price_rules.json`;

  return axios
    .post(sessionUrlPriceRule, JSON.stringify(dataPriceRule), {
      auth: {
        username: storeAPIkey,
        password: storePassword,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((response) => {
      console.log('response is (price rule create):   ', response);
      return response;
    })
    .catch((error) => {
      console.log('@@@@@@@@@@ERROR AT PRICE RULE CREATE:   ', error);
      return false;
    });
}

async function shopifyDiscountCreate(
  storeMyShopify,
  apiVersion,
  storeAPIkey,
  storePassword,
  priceRuleId,
  randomString,
) {
  const dataDiscount = {
    discount_code: {
      code: randomString,
    },
  };

  const sessionUrlDiscount = `https://${storeMyShopify}/admin/api/${apiVersion}/price_rules/${priceRuleId}/discount_codes.json`;
  console.log(sessionUrlDiscount);
  return axios
    .post(sessionUrlDiscount, JSON.stringify(dataDiscount), {
      auth: {
        username: storeAPIkey,
        password: storePassword,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((response) => {
      console.log(response);
      const discountedUrl = `http://${storeMyShopify}/discount/${randomString}`;
      console.log('test link is: ', discountedUrl);
      return response;
    })
    .catch((error) => {
      // handle error
      console.log('@@@@@@@@@@ERROR AT DISCOUNT CREATE:   ', error);
      return false;
    });
}

exports.shopifyDiscountCreate = shopifyDiscountCreate;
exports.shopifyStoreDiscountsInitialize = shopifyStoreDiscountsInitialize;
module.exports = exports;
