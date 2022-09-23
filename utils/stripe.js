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
const PaymentIntentCreate = async (customer, amount) => {

    const paymentIntentObject = {        
        amount: round(multiply(amount, 100),0),
        currency: 'usd',
        payment_method_types: ['card'],
        capture_method: 'manual',
    };

    if (customer){
        paymentIntentObject.customer = customer;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentObject);

    return {
        paymentIntentId: paymentIntent.id,
        client_secret: paymentIntent.client_secret
    }
} 

const capturePayment = async (paymentIntentId) => {
    const intent = await stripe.paymentIntents.capture(paymentIntentId) 
    console.log(intent)   
    return intent
}

// capturePayment("pi_3LlDbJHuM2wzausD00Dss0V9")

const DetachPaymentMethod = async (paymentMethodId) => {
    const paymentMethod = await stripe.paymentMethods.detach(
        paymentMethodId
    );
    return paymentMethod.data;
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
    FetchPaymentMethods,
    PaymentIntentCreate,
    capturePayment,
    DetachPaymentMethod
}


// save payment method

// create payment intent

// trigger payment on saved payment method

// refund / partial refund

// handle webhook response