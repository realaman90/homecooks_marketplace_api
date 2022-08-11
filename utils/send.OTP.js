const twilioClient = require('./twilio.client');
const sgMail = require('./sendgrid.client');

const OTP = require('../models/OTP');
const sendOTP = async(userFromDB, reason) => {
    const fourDigitOTP = Math.floor(1000 + Math.random() * 9000);

    const message = `Hi! ${userFromDB.fullName}! Your verificaton code is ${fourDigitOTP}`;
    const otp = await OTP.create({
        user: userFromDB,
        otp: fourDigitOTP,
        reason
    });
    //phone
    if (userFromDB.role != 'user') {
        try {
            const response = await twilioClient.messages.create({
                from: process.env.TWILIO_PHONE_NUMBER,
                to: "+" + userFromDB.phone,
                body: message,
            });
        } catch (error) {
            console.log(error);
        }
    }

    //email

    if (userFromDB.role === 'user') {
        const msg = {
            to: `${userFromDB.email}`, // recipient
            from: `${process.env.SGSENDER}`, //  sender

            templateId: process.env.OTPTEMPLATEID,
            dynamicTemplateData: {
                subject: `${userFromDB.fullName} your verification code`,
                name: `${userFromDB.fullName}`,
                otp: `${fourDigitOTP}`,
            },
        }
        sgMail
            .send(msg)
            .then(() => {
                console.log('Email sent')
            })
            .catch((error) => {
                console.error(error)
            })
    }
}
module.exports = sendOTP;