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


//Express 

const app = express();

// Database
const connectDB = require('./db/connect');

// router
const authRouter = require('./route/authRoutes');
const suppliersRouter = require('./route/suppliers.routes');
const customersRouter = require('./route/customers.route');

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
app.use('/api/v1/admin/customer', customersRouter);



app.get('/api/v1/admin', (req, res) => {
    res.send('Noudada Admin Apis')
});

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