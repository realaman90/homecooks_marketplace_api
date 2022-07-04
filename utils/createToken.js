const { createJWT } = require("./jwt");

const createUserToken = (userFromDB) => {
    const user = {
        name: userFromDB.name,
        userId: userFromDB._id,
        role: userFromDB.role
    }
    const token = createJWT({
        payload: user
    })

    return token;
};

module.exports = createUserToken