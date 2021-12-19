const rp = require('request-promise-native');
const chrome = require('chrome-cookies-secure');
const { post } = require('request-promise-native');
const delay = require('delay');
const moment = require('moment');
const table = require('table');
const createStream = table.createStream;
const chalk = require('chalk');
const ora = require('ora');
const jwtDecode = require('jwt-decode');

const tableConfig = {
    columnDefault: {
        width: 25,
    },
    columnCount: 4,
    columns: [
        {
            width: 40,
        },
        {
            width: 25,
        },
        {
            width: 25,
        },
        {
            width: 8,
            alignment: 'right',
        }
    ],
};

const stream = createStream(tableConfig);

(async function () {

    var cookies = await chrome.getCookiesPromised('https://www.doordash.com/', 'object');

    if (!cookies.ddweb_token) {
        console.log(chalk.red('Error: No Doordash credentials found. Please login to https://www.doordash.com in Chrome, wait 30 seconds, and try again.'));
        return;
    }

    var decoded = jwtDecode(cookies.ddweb_token);

    console.log('You are logged in to Doordash as ' + chalk.green(decoded.user.email));

    var jar = await chrome.getCookiesPromised('https://www.doordash.com/', 'jar');

    // Fetch the orders page because Doordash would probably expect us to before retrieving orders
    var ordersPageBody = await rp({
        url: 'https://www.doordash.com/orders/', jar: jar
    });

    var pandemicEpoch = moment('2020-03-01', 'YYYY-MM-DD');

    var batchSize = 25;
    var offset = 0;

    var graphqlResponse;
    var response;

    var keepGoing = true;

    var orders = [];

    stream.write(['Order ID', 'Order Date', 'Store', 'Total']);

    const spinner = ora('Fetching orders').start();

    do {

        spinner.start('Fetching orders');
        spinner.stop();

        graphqlResponse = await rp({
            method: 'POST',
            uri: 'https://www.doordash.com/graphql',
            jar: jar,
            headers: {
                "accept": "*/*",
                "accept-language": "en-US",
                "apollographql-client-name": "@doordash/app-consumer-production",
                "apollographql-client-version": "0.599.0-production",
                "content-type": "application/json",
                "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"96\", \"Google Chrome\";v=\"96\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-channel-id": "marketplace",
                "x-csrftoken": cookies.csrf_token,
                "x-experience-id": "doordash",
                "Referer": "https://www.doordash.com/orders/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            body: "{\"operationName\":\"getConsumerOrdersWithDetails\",\"variables\":{\"offset\":" + offset + ",\"limit\":" + batchSize + ",\"includeCancelled\":true},\"query\":\"query getConsumerOrdersWithDetails($offset: Int!, $limit: Int!, $includeCancelled: Boolean) {\\n  getConsumerOrdersWithDetails(offset: $offset, limit: $limit, includeCancelled: $includeCancelled) {\\n    id\\n    orderUuid\\n    deliveryUuid\\n    createdAt\\n    submittedAt\\n    cancelledAt\\n    fulfilledAt\\n    specialInstructions\\n    isConsumerSubscriptionEligible\\n    isGroup\\n    isGift\\n    isPickup\\n    isMerchantShipping\\n    containsAlcohol\\n    creator {\\n      ...ConsumerOrderCreatorFragment\\n      __typename\\n    }\\n    deliveryAddress {\\n      id\\n      formattedAddress\\n      __typename\\n    }\\n    orders {\\n      id\\n      creator {\\n        ...ConsumerOrderCreatorFragment\\n        __typename\\n      }\\n      items {\\n        ...ConsumerOrderOrderItemFragment\\n        __typename\\n      }\\n      __typename\\n    }\\n    paymentCard {\\n      ...ConsumerOrderPaymentCardFragment\\n      __typename\\n    }\\n    grandTotal {\\n      unitAmount\\n      currency\\n      decimalPlaces\\n      displayString\\n      sign\\n      __typename\\n    }\\n    likelyOosItems {\\n      menuItemId\\n      name\\n      photoUrl\\n      __typename\\n    }\\n    pollingInterval\\n    store {\\n      id\\n      name\\n      business {\\n        id\\n        name\\n        __typename\\n      }\\n      phoneNumber\\n      fulfillsOwnDeliveries\\n      customerArrivedPickupInstructions\\n      isPriceMatchingEnabled\\n      priceMatchGuaranteeInfo {\\n        headerDisplayString\\n        bodyDisplayString\\n        buttonDisplayString\\n        __typename\\n      }\\n      __typename\\n    }\\n    isGroupTopOff\\n    __typename\\n  }\\n}\\n\\nfragment ConsumerOrderPaymentCardFragment on ConsumerOrderPaymentCard {\\n  id\\n  last4\\n  type\\n  __typename\\n}\\n\\nfragment ConsumerOrderOrderItemFragment on ConsumerOrderOrderItem {\\n  id\\n  name\\n  quantity\\n  specialInstructions\\n  substitutionPreferences\\n  orderItemExtras {\\n    ...ConsumerOrderOrderItemExtraFragment\\n    __typename\\n  }\\n  purchaseQuantity {\\n    ...ConsumerOrderQuantityFragment\\n    __typename\\n  }\\n  fulfillQuantity {\\n    ...ConsumerOrderQuantityFragment\\n    __typename\\n  }\\n  originalItemPrice\\n  purchaseType\\n  __typename\\n}\\n\\nfragment ConsumerOrderOrderItemExtraOptionFields on OrderItemExtraOption {\\n  menuExtraOptionId\\n  name\\n  description\\n  price\\n  quantity\\n  __typename\\n}\\n\\nfragment ConsumerOrderOrderItemExtraOptionFragment on OrderItemExtraOption {\\n  ...ConsumerOrderOrderItemExtraOptionFields\\n  orderItemExtras {\\n    ...ConsumerOrderOrderItemExtraFields\\n    orderItemExtraOptions {\\n      ...ConsumerOrderOrderItemExtraOptionFields\\n      orderItemExtras {\\n        ...ConsumerOrderOrderItemExtraFields\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment ConsumerOrderOrderItemExtraFields on OrderItemExtra {\\n  menuItemExtraId\\n  name\\n  __typename\\n}\\n\\nfragment ConsumerOrderOrderItemExtraFragment on OrderItemExtra {\\n  ...ConsumerOrderOrderItemExtraFields\\n  orderItemExtraOptions {\\n    ...ConsumerOrderOrderItemExtraOptionFragment\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment ConsumerOrderCreatorFragment on ConsumerOrderCreator {\\n  id\\n  firstName\\n  lastName\\n  __typename\\n}\\n\\nfragment ConsumerOrderQuantityFragment on Quantity {\\n  continuousQuantity {\\n    quantity\\n    unit\\n    __typename\\n  }\\n  discreteQuantity {\\n    quantity\\n    unit\\n    __typename\\n  }\\n  __typename\\n}\\n\"}",
        });

        response = JSON.parse(graphqlResponse);

        for (var order of response.data.getConsumerOrdersWithDetails) {
            var date = moment(order.createdAt, "YYYY-MM-DDTHH:mm:ss.SSSZ");
            if (date.isBefore(pandemicEpoch)) {
                keepGoing = false;
                break;
            }
            var orderDate = date.format("MMM D, YYYY h:mm A");
            // console.log(order.orderUuid + ' - ' + orderDate + ' - ' + order.grandTotal.displayString);
            order.date = date;
            orders.push(order);
            stream.write([order.orderUuid, orderDate, order.store.name, order.grandTotal.displayString]);
        }

        if (response.data.getConsumerOrdersWithDetails.length < 10) {
            keepGoing = false;
        }

        offset += batchSize;

        if (keepGoing) {

            for (var i = 10; i > 0; i--) {
                spinner.start('Waiting for ' + i + ' seconds to avoid getting rate-limited');
                await delay(1000);
            }
            spinner.stop();

        }

    } while (keepGoing);

    var total = 0;
    for (var order of orders) {
        total += order.grandTotal.unitAmount;
    }

    var displayTotal = chalk.bold.blue('$' + (total / 100));

    console.log("\n");
    console.log(`You've spent ${displayTotal} with Doordash during the pandemic.`);

}());
