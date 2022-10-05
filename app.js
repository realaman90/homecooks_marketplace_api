// node packages
require('dotenv').config();
require('express-async-errors');

const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const expressFileUpload = require('express-fileupload');
const rateLimiter = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const cors = require('cors');
const mongoSanatize = require('express-mongo-sanitize');

const { authenticateUser, authorizePermissions } = require('./middleware/full-auth');

//Express 

const app = express();

// Database
const connectDB = require('./db/connect');
require("./utils/s3.utils");

// router
const authRouter = require('./route/authRoutes');
const suppliersRouter = require('./route/suppliers.routes');
const usersRouter = require('./route/users.route');
const eventRouter = require('./route/event.routes');
const customerRouter = require('./route/customers.routes');
const orderRouter = require('./route/order.routes');
const dishRouter = require('./route/dish.routes');
const bikerPickupPoint = require('./route/bikerPickupPoint.routes');
const clientPickupPointRouter = require('./route/clientPickupPoint.routes');
const verificationOTP = require('./route/verification.otp.route')
const kartRouter = require('./route/kart.routes');
const checkoutRouter = require('./route/checkout.routes');
const payoutRouter = require('./route/payout.routes');
const pickUpAreaRouter = require('./route/pickupArea.routes');
const items = require('./route/item.routes');
const itemsForAdmin = require('./route/item.admin.routes')
const notificationRouter = require('./route/notification.routes');
const newsLetterRouter = require('./route/newsletter.routes');
const enquiryRouter = require('./route/enquiry.routes');
const cuisineRouter = require('./route/cuisine.routers');
const stripeRouter = require('./route/stripe.routes');
const paymentRouter = require('./route/payment.routes');
const customerPaymentRouter = require('./route/customerPayment.routes');
const wishlistRouter = require('./route/wishlist.routes');
const quorumRouter = require('./route/quorum.routes');
const { markOrderDelivedThruQR } = require('./controllers/order.controller');

require('./controllers/cron.controller');

//middleware
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

app.set('trust-proxy', 1);
// app.use(rateLimiter({
//     windowMs: 1800 * 60 * 1000,
//     max: 9000
// }));
app.use(helmet());
app.use(cors());
app.use(mongoSanatize());


app.use(morgan('tiny'));
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));

app.use(express.static('./public'));
app.use(expressFileUpload());

//apis admin
app.use('/api/v1/admin/auth', authRouter);
app.use('/api/v1/admin/supplier', suppliersRouter);
app.use('/api/v1/admin/user', usersRouter);

// mark order delivered
app.get('/qr/:userId/:pickupPoint/:pickupDate', markOrderDelivedThruQR);


app.use('/api/v1/admin/event', authenticateUser, authorizePermissions('admin'), eventRouter);
app.use('/api/v1/admin/dish', authenticateUser, authorizePermissions('admin'), dishRouter);
app.use('/api/v1/admin/order', authenticateUser, authorizePermissions('admin', 'user'), orderRouter);
app.use('/api/v1/admin/payout', authenticateUser, authorizePermissions('admin'), payoutRouter);
app.use('/api/v1/admin/pickUpArea', authenticateUser, authorizePermissions('admin'), pickUpAreaRouter);
app.use('/api/v1/admin/products', authenticateUser, authorizePermissions('admin'), itemsForAdmin);
app.use('/api/v1/admin/cuisine', authenticateUser, authorizePermissions('admin'), cuisineRouter);
app.use('/api/v1/admin/payments', authenticateUser, authorizePermissions('admin'), paymentRouter)

//apis for suppliers
app.use('/api/v1/admin/bikerPickupPoint', authenticateUser, authorizePermissions('admin'), bikerPickupPoint);

//quorum processing
app.use('/api/v1/admin/quorum', authenticateUser, authorizePermissions('admin'), quorumRouter);

//apis for clients
app.use('/api/v1/admin/clientPickupPoint', authenticateUser, authorizePermissions('admin'), clientPickupPointRouter);

app.use('/api/v1/stripe', authenticateUser, authorizePermissions('user'), stripeRouter);

//apis for customers
app.use('/api/v1/customer', customerRouter);
app.use('/api/v1/kart', authenticateUser, authorizePermissions('user'), kartRouter);
app.use('/api/v1/checkout', authenticateUser, authorizePermissions('user'), checkoutRouter);
app.use('/api/v1/wishlist', authenticateUser, authorizePermissions('user'), wishlistRouter);
app.use('/api/v1/products', items);
app.use('/api/v1/newsletter', newsLetterRouter);
app.use('/api/v1/enquiry', enquiryRouter);
app.use('/api/v1/orders', authenticateUser, authorizePermissions('admin', 'user'), orderRouter);
app.use('/api/v1/payments', authenticateUser, authorizePermissions('admin', 'user'), customerPaymentRouter);

// for both admin and user
app.use('/api/v1/notification', authenticateUser, authorizePermissions('user', 'admin'), notificationRouter);


app.get('/api/v1/admin', (req, res) => {
    res.send('Noudada Admin Apis')
});

//OTP verification
app.use('/api/v1/admin/', verificationOTP)

//Error Middlewares
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000
const start = async() => {
    try {
        await connectDB(process.env.MONGO_URL);
        app.listen(port, () => {
            console.log(`Server is listening on port ${port}....`)
        });
    } catch (error) {
        console.log(error)
    }
}


start();

// const {formatInTimeZone} = require('date-fns-tz');


// var addHours = require('date-fns/addHours')
// var format = require('date-fns/format')

// const currentLocalDate = new Date();
// console.log(currentLocalDate)
// // Create a Date instance for 03:24 GMT-0200 on May 1st in 2016
// const laborDay2016at0324GMTminus2 = new Date('2016-05-01T03:24:00Z-02:00');
// console.log(laborDay2016at0324GMTminus2)
// console.log(currentLocalDate.getTimezoneOffset() === laborDay2016at0324GMTminus2.getTimezoneOffset())


// const dates = [
//     'Mon Feb 17 2020 00:00:00 GMT+0530 (India Standard Time)',
//     'Tue Feb 18 2020 00:00:00 GMT+0530 (India Standard Time)',
//     'Wed Feb 19 2020 00:00:00 GMT+0530 (India Standard Time)',
//     'Thu Feb 20 2020 00:00:00 GMT+0530 (India Standard Time)',
//   ],
//   result = dates.map(date => new Date(date.replace(/ GMT.*/,'')).toLocaleDateString('en-GB'))
  
// console.log(result)    



// let today = new Date('2022', '2', '28');

// console.log(today.toString()); 
// console.log(today.toDateString()); 
// console.log(today.toISOString()); 
// console.log(today.toLocaleDateString()) 



// // function changeTimezone() {
      
// //     let date = 
// //         new Date(Date.UTC(2012, 11, 20, 3, 0, 0));
// //     console.log('Given IST datetime: ' + date);
  
// //     let usaTime = 
// //         date.toLocaleString("en-US", {
// //             timeZone: "America/New_York" 
// //         });
// //     console.log('USA datetime: ' + usaTime);
// // }
// // changeTimezone()



// // let moment = require('moment');
// // var now = moment();
// // var localOffset = now.utcOffset();

// // now.tz("America/Chicago"); // your time zone, not necessarily the server's
// // var centralOffset = now.utcOffset();
// // var diffInMinutes = localOffset - centralOffset;



// function getOffsetBetweenTimezonesForDate(date, timezone1, timezone2) {
//     const timezone1Date = convertDateToAnotherTimeZone(date, timezone1);
//     const timezone2Date = convertDateToAnotherTimeZone(date, timezone2);

//     console.log(timezone1Date)
//     console.log(timezone2Date)

//     return timezone1Date.getTime() - timezone2Date.getTime();
//   }
  
//   function convertDateToAnotherTimeZone(date, timezone) {
//     const dateString = date.toLocaleString('en-US', {
//       timeZone: timezone
//     });
//     return new Date(dateString);
//   }



//   const offset = getOffsetBetweenTimezonesForDate(today, 'America/Tijuana', 'Atlantic/Reykjavik');
//   console.log(offset/3600000)


//   today = addHours(today, offset/3600000)
  
//   console.log(`6:`,today)


//   today = format(today, 'yyyy-MM-dd HH:mm:ssXXX', { timeZone: 'America/Tijuana' }) // 2014-10-25 06:46:20-04:00
//   today = new Date(today)


//   today = today.toLocaleString('en-US', {
//     timeZone: 'America/Tijuana'
//   });        

//   console.log(`5:`,today)






// //   addHours(offset/360000)