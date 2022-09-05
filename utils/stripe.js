const stripe = require('stripe')(process.env.SECRET_KEY);

// create customer
const CreateStripeCutomer = async (name, email) => {

    const customer = await stripe.customers.create({
      name,
      email,
    });

    return customer.id;

};

const SetupIntentFrCard = async (stripeCustId) => {

    const setupIntent = await stripe.setupIntents.create({
        payment_method_types: ['card'],
        customer: stripeCustId,
    });

    return setupIntent.client_secret;
}

// (async () => {
//     console.log("asdflajsdkfjlasjdkf")
//     const cust = await CreateStripeCutomer()

//     console.log(cust)
    
//     const setupIntent = await SetupIntentFrCard(cust)

//     console.log(setupIntent)
// })()


module.exports = {
    CreateStripeCutomer,
    SetupIntentFrCard
}


// save payment method

// create payment intent

// trigger payment on saved payment method

// refund / partial refund

// handle webhook response