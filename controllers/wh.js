const {
  generateSlug,
} = require('random-word-slugs');
const UserStates = require('../db/models/Userstate');
const UserDiscount = require('../db/models/UserDiscount');
const msgCtrl = require('./msg');

const storeAPIkey = 'a55e9f8e5d6feebd23752396acd80cc4';
const storePassword = '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';
const accessToken = '9d75b9d30a16f02bb9517f2aafd9bd48';
const storeMyShopify = 'banarasi-outfit.myshopify.com';
const externalUrl = 'banarasioutfit.in';
const apiVersion = '2021-04';
const priceRuleId = '942249935042';

const {
  retireveCollections,
  createCheckoutList,
  getProductsByCollectionHandle,
  retireveVariantsOfProduct,
} = require('./storefrontAPI');
const {
  shopifyDiscountCreate,
} = require('./discountRestAPI');
const {
  getAllOrders,
} = require('../getAllOrders');
// const UserDiscount = require('../db/models/UserDiscountModel');

// const discount = new UserDiscount({ phone: 'string', discountCode: 'string' });
// UserDiscount.create({ discountCode: 'string' }, (err, res) => {
//   if (err) return console.log(err);
//   return res;
// });

function handleMessage(req, res) {
  res.status(200).send('');

  const fromNumber = req.body.From || req.body.From;
  if (fromNumber === 'whatsapp:+14155238886') return;
  const msg = req.body.Body || req.body.Body;
  // eslint-disable-next-line no-console
  console.log('wh controller', fromNumber, msg, req.body);

  const errorHandler = (err) => {
    // eslint-disable-next-line no-console
    console.log(err);
    msgCtrl.sendMsg({
      fromNumber,
      msg: JSON.stringify(err),
    });
  };

  function createNewDialog() {
    UserStates
      .create({
        phone: fromNumber,
        last: 'demoMain',
      })
      .then(() => {
        msgCtrl.sendMsg({
          fromNumber,
          msg: 'Hello! Are your here to receive a discount for Banasari Outfits ?\n1. Yes\n2. No',
        });
      }).catch(errorHandler);
  }

  function sendCatalog() {
    retireveCollections(storeMyShopify, accessToken).then((
      response,
    ) => {
      console.log('sendCatalog');
      const collections = `*Select catalog:*\n${
        response.collections.edges
          .map((val, idx) => `${idx + 1}. ${val.node.handle}`)
          .join('\n')}`;
      // eslint-disable-next-line no-console
      console.log(collections, fromNumber);
      msgCtrl.sendMsg({
        fromNumber,
        msg: collections
      });
      UserStates.updateOne(
        {
          phone: fromNumber,
        },
        {
          $set: {
            last: 'catalog',
            catalogs,
          },
        }, errorHandler,
      ).exec();
    }).catch(errorHandler);
  }
  function resendCommand() {
    msgCtrl.sendMsg({
      fromNumber,
      msg: 'Please, send right command\nWould you like to return to maun menu?\n1.Yes',
    });
  }
  const getSupport = () => {
    msgCtrl.sendMsg({
      fromNumber,
      msg: 'Hi there! Welcome to Customer Support Service! Please describe your problem, we will be contact with you within 10 minutes.',
    });
    UserStates.updateOne(
      {
        phone: fromNumber,
      },
      {
        $set: {
          last: 'support',
        },
      },
    ).exec();
  };

  function sendTopBackMenu() {
    msgCtrl.sendMsg({
      fromNumber,
      msg: 'Is there anything else that you want?\n*1. Catalogue*\n*2. Customer Support*\n*3. Order Status*\n*4. Abandoned cart*',
    });
  }
  const getOrderStatus = () => {
    msgCtrl.sendMsg({
      fromNumber,
      msg: 'Type your tracking number OR email.\n(Demo: copy paste below tracking number)',
    });
    setTimeout(() => {
      msgCtrl.sendMsg({
        fromNumber,
        msg: 'UH037386106US',
      });
    }, 3000);
    UserStates.updateOne(
      {
        phone: fromNumber,
      },
      {
        $set: {
          last: 'tracking',
        },
      },
    ).exec();
  };
  function sendDiscount() {
    const discountSlug = generateSlug();
    shopifyDiscountCreate(
      storeMyShopify,
      apiVersion,
      storeAPIkey,
      storePassword,
      priceRuleId,
      discountSlug,
    )
      .then((response) => {
        const { code } = response.data.discount_code;
        const discountedUrl = `http://${externalUrl}/discount/${code}`;

        UserDiscount
          .create({
            discountCode: discountSlug,
            phone: fromNumber,
          })
          .then(() => {
            msgCtrl.sendMsg({
              fromNumber,
              msg: `Here is your promocode(click this link): ${discountedUrl}`,
            });
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.log(err);
            msgCtrl.sendMsg({
              fromNumber,
              msg: 'error on creating discount',
            });
          });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.log(err);
        msgCtrl.sendMsg({
          fromNumber,
          msg: 'error on creating discount',
        });
      });
  }
  function continueDialog(state) {
    console.log('continueDialog', msg);

    if (msg.toLowerCase() === 'main') {
      msgCtrl.sendMsg({
        fromNumber,
        msg: '*Hello! What do you want?*\n1. Catalogue\n2. Customer Support\n3. Order Status',
      });
      UserStates.updateOne(
        {
          phone: fromNumber,
        },
        {
          $set: {
            last: 'main',
          },
        },
      ).exec();
      return;
    }

    if (state.last === 'main') {
      switch (msg) {
        case '1': {
          sendCatalog();
          break; }
        case '2': {
          getSupport();
          break; }
        case '3': {
          getOrderStatus();
          break; }
        case '4': {
          sendDiscount();
          break;
        }
        default: {
          resendCommand(fromNumber);
          break;
        }
      }
    } else if (state.last === 'tracking') {
      if (/@/.test(msg)) {
        getAllOrders(storeMyShopify, apiVersion, storeAPIkey, storePassword)
          .then((response) => {
            const trackNumbers = response.data.orders
              .filter((ord) => ord.email === msg)
              .map((ord) => ord.fulfillments.tracking_nunmbers)
              .flat();
            const arr = Array.from(new Set(trackNumbers));
            const ordersListTxt = arr
              .map(
                (trackNum, idx) => `${idx + 1}. https://t.17track.net/en#nums=${trackNum}`,
              )
              .join('\n');
            if (!ordersListTxt) {
              msgCtrl.sendMsg({
                fromNumber,
                msg: 'There is no order with such email, please recheck your email.',
              });
              return;
            }
            const txt = `Orders for email '${msg}':\n${ordersListTxt}`;
            msgCtrl.sendMsg({
              fromNumber,
              msg: txt,
            });
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.log(err);
            msgCtrl.sendMsg({
              fromNumber,
              msg: 'error on creating tracking url',
            });
          });
      } else {
        const trackingUrl = `https://t.17track.net/en#nums=${msg}`;
        msgCtrl.sendMsg({
          fromNumber,
          msg: `Please open this link to track your order!\n${trackingUrl}`,
        });
      }
    } else if (state.last === 'catalog') {
      if (!state.catalogs[msg - 1]) {
        resendCommand(fromNumber);
        return;
      }
      const { handle } = state.catalogs[msg - 1].node;
      getProductsByCollectionHandle(storeMyShopify, accessToken, handle).then(
        (response) => {
          console.log(response.collectionByHandle.products.edges);
          const products = response.collectionByHandle.products.edges;
          let txt = products
            .map((pr, idx) => `${idx + 1}. ${pr.node.handle}`)
            .join('\n');
          txt = `Select Product:\n${txt.split('-').join(' ')}`;

          msgCtrl.sendMsg({
            fromNumber,
            msg: txt,
          });
          UserStates.updateOne(
            {
              phone: fromNumber,
            },
            {
              $set: {
                last: 'products',
                products,
              },
            },
          ).exec();
        },
      );
    } else if (state.last === 'products') {
      if (!state.products[msg - 1]) {
        resendCommand(fromNumber);
        return;
      }

      const productID = state.products[msg - 1].node.id;
      retireveVariantsOfProduct(storeMyShopify, accessToken, productID).then(
        (response) => {
          const variants = response.node.variants.edges;
          const variantsSize = variants.length;
          variants.forEach((item, indx) => {
            const { title } = item.node;
            const imgUrl = item.node.image.originalSrc;
            msgCtrl.sendMsg({
              fromNumber,
              msg: `${indx + 1}. ${title}`,
              mediaUrl: imgUrl,
            });
            if (indx === variantsSize - 1) {
              setTimeout(() => {
                let txt = variants
                  .map((v, idx) => `${idx + 1}. ${v.node.title}`)
                  .join('\n');
                txt = `*Select variants:*\n${txt}`;
                msgCtrl.sendMsg({
                  fromNumber,
                  msg: txt,
                });
                UserStates.updateOne(
                  {
                    phone: fromNumber,
                  },
                  {
                    $set: {
                      last: 'variants',
                      variants,
                    },
                  },
                ).exec();
              }, 3000);
            }
          });
        },
      );
    } else if (state.last === 'variants') {
      if (!state.variants[msg - 1]) {
        resendCommand(fromNumber);
        return;
      }
      const { id: variantID, title } = state.variants[msg - 1].node;
      const storedLineItems = state.storedLineItems || [];
      const existsVariant = storedLineItems.find(
        (x) => x.variantId === variantID,
      );
      if (existsVariant) existsVariant.quantity += 1;
      else {
        storedLineItems.push({
          variantId: variantID,
          quantity: 1,
          title,
        });
      }
      const txt = '*Your item is placed in cart.What do you want next?* \n1.Continue shopping\n2.See my cart \n3.Proceed to payment';
      msgCtrl.sendMsg({
        fromNumber,
        msg: txt,
      });
      UserStates.updateOne(
        {
          phone: fromNumber,
        },
        {
          $set: {
            last: 'added-to-cart',
            storedLineItems,
          },
        },
      ).exec();
    } else if (state.last === 'added-to-cart') {
      switch (msg) {
        case '1': {
          sendCatalog();
          break;
        }
        case '2':
          {
            const txt = `*Your cart is:*\n${state.storedLineItems
              .filter((x) => x.title && x.quantity)
              .map(
                ({ title, quantity }, idx) => `${idx + 1}. ${title} - ${quantity}`,
              )
              .join('\n')}\n\n*What do you want to do next?*\n1. Continue Shopping \n2. Proceed to payment \n3. Delete item`;
            msgCtrl.sendMsg({
              fromNumber,
              msg: txt,
            });
            UserStates.updateOne(
              {
                phone: fromNumber,
              },
              {
                $set: {
                  last: 'cart',
                },
              },
              errorHandler,
            ).exec();
          }
          break;
        case '3': {
          createCheckoutList(
            storeMyShopify,
            accessToken,
            state.storedLineItems.map((x) => ({
              variantId: x.variantId,
              quantity: x.quantity,
            })),
          )
            .then((createdCheckoutInfo) => {
              const txt = `Congratulations!\nYour order is almost created.\nPlease, open this url and finish him!\n ${
                createdCheckoutInfo.checkoutCreate.checkout.webUrl}`;
              msgCtrl.sendMsg({
                fromNumber,
                msg: txt,
              });
              UserStates.updateOne({
                phone: fromNumber,
              },
              {
                $set: {
                  last: 'completed',
                  storedLineItems: [],
                },
              },
              errorHandler);
              setTimeout(() => {
                sendTopBackMenu();
              }, 5000);
            });

          break; }
        default: {
          msgCtrl.sendMsg({
            fromNumber,
            msg: '*Please,send right command*',
          });
          break;
        }
      }
    } else if (state.last === 'cart') {
      switch (msg) {
        case '2': {
          createCheckoutList(
            storeMyShopify,
            accessToken,
            state.storedLineItems,
          )
            .then((createdCheckoutInfo) => {
              const txt = `Congratulations! \nYour order is almost created.\nPlease, open this url and finish him!\n ${
                createdCheckoutInfo.checkoutCreate.checkout.webUrl}`;
              msgCtrl.sendMsg({
                fromNumber,
                msg: txt,
              });
              UserStates.updateOne({
                phone: fromNumber,
              },
              {
                $set: {
                  last: 'completed',
                  storedLineItems: [],
                },
              },
              errorHandler).exec();
            });

          break;
        }
        case '3': {
          UserStates.updateOne({
            phone: fromNumber,
          }, {
            $set: {
              last: 'removeItem',
            },
          });
          break;
        }
        case '1': {
          sendCatalog();
          break;
        }
        default: {
          msgCtrl.sendMsg({
            fromNumber,
            msg: 'Please, send right command',
          });
          break;
        }
      }
    } else if (state.last === 'removeItem') {
      const storedLineItemsText = state.storedLineItems
        .filter((x) => x.title && x.quantity)
        .map(
          ({ title, quantity }, idx) => `${idx + 1}. ${title}: ${quantity}`,
        )
        .join('\n');
      const txt = `${storedLineItemsText}\n *Select item that you are gonna delete*`;
      msgCtrl.sendMsg({
        fromNumber,
        msg: txt,
      });
      UserStates.updateOne(
        {
          phone: fromNumber,
        },
        {
          $set: {
            last: 'deleteItem',
          },
        },
        errorHandler,
      ).exec();
    } else if (state.last === 'deleteItem') {
      const newList = this.storedLineItems.filter((t) => t.variantId === msg);
      UserStates.updateOne(
        {
          phone: fromNumber,
        },
        {
          $set: {
            last: 'deleteItem',
            storedLineItems: newList,
          },
        },
      ).exec();
    } else if (state.last === 'demoMain') {
      if (msg === '1') {
        sendDiscount();
      } else {
        msgCtrl.sendMsg({
          fromNumber,
          msg: 'Hello! What do you want?\n1. Catalogue\n2. Customer Support\n3. Order Status\n4. Abandoned cart demo',
        });
        UserStates.updateOne(
          {
            phone: fromNumber,
          },
          {
            $set: {
              last: 'main',
            },
          },
        ).exec();
      }
    } else {
      // eslint-disable-next-line no-constant-condition
      console.log("state.last !== 'main'", state);
    }
  }

  UserStates
    .findOne({
      phone: fromNumber,
    },
    (err, result) => {
      if (err) {
        return console.log(err);
      }
      if (!result) {
        createNewDialog();
      } else {
        continueDialog(result);
      }
      return result;
    });
}
module.exports = {
  handleMessage,
};
