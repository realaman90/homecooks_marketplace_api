const sgMail = require('../utils/sendgrid.client');
const { MemoryStore } = require('express-rate-limit');

// type: notificationTypes.WELCOME_FR_USER,
//         toId: userId,
//         toEmail: userDetails.email,
//         toPhone: userDetails.phone,
//         userNotificationSettings: userDetails.notificationSettings,
//         message: {
//             subject,
//             emailMessage,
//             smsMessage,
//             appMessage,
//         },

const sendEmail = async (nr) => {    

    if (!nr.toEmail){
        return
    }

    if (!nr.userNotificationSettings.email){
        return
    }
    await sgMail.send({
        to: `${nr.toEmail}`, // recipient
        from: `${process.env.SGSENDER}`, //  sender

        subject: nr.message.subject,
        text: nr.message.emailMessage,
        html: `<strong>${nr.message.emailMessage}</strong>`,
    })        
    return
}

const sendMultipleEmails = async (nrs) =>{
    for (let i =0; i< nrs.length; i++){
        const nr = nrs[i];
        await sendEmail(nr)
    }
}

const sendEmailWithTemplate = async (nr) => {
    
    try {

        if (!nr.userNotificationSettings.email){
            return
        }
        const msg = {
            to: `${nr.toEmail}`, // recipient
            from: `${process.env.SGSENDER}`, //  sender

            templateId: nr.templateId, // nr.templateId
            dynamicTemplateData: nr.templateData, // nr.templateValues
        }
        
        const resp = await sgMail.send(msg)
        
        return

    } catch(err){

        console.log(err.response.body)
    }

}
    
const sendMultipleEmailsWithTemplates = async (nrs) =>{
    for (let i =0; i< nrs.length; i++){
        const nr = nrs[i];
        await sendEmailWithTemplate(nr)
    }
}


module.exports = {
    sendEmail,
    sendMultipleEmails,
    sendEmailWithTemplate,
    sendMultipleEmailsWithTemplates
}