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

// router
const authRouter = require('./route/authRoutes');
const suppliersRouter = require('./route/suppliers.routes');
const usersRouter = require('./route/users.route');
const customerRouter = require('./route/customers.routes');
const groupRouter = require('./route/group.routes');
const orderRouter = require('./route/order.routes');
const productRouter = require('./route/product.routes');
const bikerPickupPoint = require('./route/bikerPickupPoint.routes');
const clientPickupPointRouter = require('./route/clientPickupPoint.routes');
const verificationOTP = require('./route/verification.otp.route')

//middleware
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

app.set('trust-proxy', 1);
app.use(rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 60
}));
app.use(helmet());
app.use(cors());
app.use(mongoSanatize());


app.use(morgan('tiny'));
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));

app.use(express.static('./public'));
app.use(expressFileUpload());

//apis
app.use('/api/v1/admin/auth', authRouter);
app.use('/api/v1/admin/supplier', suppliersRouter);
app.use('/api/v1/admin/user', usersRouter);
app.use('/api/v1/admin/customer', customerRouter);
app.use('/api/v1/admin/group', authenticateUser, authorizePermissions('admin'), groupRouter);
app.use('/api/v1/admin/product', authenticateUser, authorizePermissions('admin'), productRouter);
app.use('/api/v1/admin/order', authenticateUser, authorizePermissions('admin'), orderRouter);

// for suppliers
app.use('/api/v1/admin/bikerPickupPoint', authenticateUser, authorizePermissions('admin'), bikerPickupPoint);

// for clients
app.use('/api/v1/admin/clientPickupPoint', authenticateUser, authorizePermissions('admin'), clientPickupPointRouter);

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