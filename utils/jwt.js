const jwt = require('jsonwebtoken');

const createJWT = ({ payload }) => {
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_LIFETIME });
    return token
};

const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET);

const attachedCookiesToResponse = ({ res, user }) => {
    const token = createJWT({ payload: user })
    const oneDay = 1000 * 60 * 60 * 24;

    res.cookie('token', token, {
        httpOnly: true,
        //change expire time here current expiry time 3 days
        expires: new Date(Date.now() + oneDay * 3),
        secure: process.env.NODE_ENV === 'production',
        signed: true

    });


}

module.exports = {
    createJWT,
    isTokenValid,
    attachedCookiesToResponse
}