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

// make payment intent with confirm = true
const MakePayment = async (payment_method, customer, amount) => {

    let paymentSuccess = false;

    try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: round(multiply(amount, 100),0),
          currency: 'usd',
          customer,
          payment_method,
          off_session: true,
          confirm: true,
        });
        paymentSuccess = true;
      } catch (err) {
        // Error code will be authentication_required if authentication is needed
        console.log('Error code is: ', err.code);
        const paymentIntentRetrieved = await stripe.paymentIntents.retrieve(err.raw.payment_intent.id);
        console.log('PI retrieved: ', paymentIntentRetrieved.id);
      }

      return paymentSuccess

}

// MakePayment("pm_1Ll2s3HuM2wzausDbEN9Hr8A", "cus_MU0iapodBojT8K")

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



module.exports = {
    CreateStripeCustomer,
    SetupIntentFrCard,
    FetchPaymentMethods,
    PaymentIntentCreate,
    capturePayment,
    DetachPaymentMethod,
    AttachPaymentMethod,
    MakePayment
}


// save payment method

// create payment intent

// trigger payment on saved payment method

// refund / partial refund

// handle webhook response