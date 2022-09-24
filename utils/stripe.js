const stripe = require('stripe')(process.env.SECRET_KEY);
const { multiply, sum, round, evaluate } = require("mathjs");

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

// payment intent to hold payment and capture later
const PaymentIntentCreate = async (save_card, customer, amount) => {

    const paymentIntentObject = {        
        amount: round(multiply(amount, 100),0),
        currency: 'usd',
        payment_method_types: ['card'],
        capture_method: 'manual',
        customer
    };

    if (save_card){
        paymentIntentObject.setup_future_usage = "off_session"
    } else {
        paymentIntentObject.setup_future_usage = "on_session"
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentObject);

    return {
        paymentIntentId: paymentIntent.id,
        client_secret: paymentIntent.client_secret
    }
} 


const capturePayment = async (paymentIntentId) => {
    const intent = await stripe.paymentIntents.capture(paymentIntentId);
    return intent
}

// capturePayment("pi_3LlDbJHuM2wzausD00Dss0V9")

const DetachPaymentMethod = async (paymentMethodId) => {
    const paymentMethod = await stripe.paymentMethods.detach(
        paymentMethodId
    );
    return paymentMethod.data;
}

const AttachPaymentMethod = async (customer, paymentMethodId) => {
    const paymentMethod = await stripe.paymentMethods.attach(
        paymentMethodId,
        {customer}
    );
    return paymentMethod.data;
}

// AttachPaymentMethod("cus_MSmoAiBQtHqsXv", "pm_1LlVgCHuM2wzausDgu0KE6uy")



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
    FetchPaymentMethods,
    PaymentIntentCreate,
    capturePayment,
    DetachPaymentMethod,
    AttachPaymentMethod
}


// save payment method

// create payment intent

// trigger payment on saved payment method

// refund / partial refund

// handle webhook response