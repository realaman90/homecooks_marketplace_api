const CustomError = require('../errors');

const checkPermissions = (requestUser, rescourceUserId) => {

    if (requestUser.role === 'admin') return;
    if (requestUser.userId === rescourceUserId.toString()) return;
    throw new CustomError.UnauthorizedError('Not Authorised to access this route')
}

module.exports = checkPermissions