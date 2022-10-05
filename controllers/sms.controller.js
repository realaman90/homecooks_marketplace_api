

const twilioClient = require('../utils/twilio.client');

const sendSMS = async(nr) => {
    console.log("send sms!")

    console.log(nr)
    try {
        const response = await twilioClient.messages.create({
            from: process.env.TWILIO_PHONE_NUMBER,
            to: "+" + nr.toPhone,
            body: nr.message.smsMessage,
        });
        console.log("sms sent!")
        console.log(response)
    } catch (error) {
        console.log("error sending sms")
        console.log(error);
    }


}

module.exports = {
    sendSMS
}