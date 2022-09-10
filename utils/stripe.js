const stripe = require('stripe')(process.env.SECRET_KEY);

// create customer
const CreateStripeCustomer = async (name, email) => {

    const customer = await stripe.customers.create({
      name,
      email,
    });

    return customer.id;
};

// CreateStripeCustomer("Test Notification", "amanrawatamg@gmail.com")

const SetupIntentFrCard = async (stripeCustId) => {

    const setupIntent = await stripe.setupIntents.create({
        payment_method_types: ['card'],
        customer: stripeCustId,
    });

    return setupIntent.client_secret;
}

const FetchPaymentMethods = async (stripeCustId) => {

    const paymentMethods = await stripe.customers.listPaymentMethods(
        stripeCustId,
        {type: 'card'}
    );

    return paymentMethods.data;
}

// FetchPaymentMethods("cus_MPJQi5K86sVVrV")

// (async () => {
//     console.log("asdflajsdkfjlasjdkf")
//     const cust = await CreateStripeCustomer()

//     console.log(cust)
    
//     const setupIntent = await SetupIntentFrCard(cust)

//     console.log(setupIntent)
// })()


module.exports = {
    CreateStripeCustomer,
    SetupIntentFrCard,
    FetchPaymentMethods
}


// save payment method

// create payment intent

// trigger payment on saved payment method

// refund / partial refund

// handle webhook response