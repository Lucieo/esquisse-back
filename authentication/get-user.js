const jwt = require('jsonwebtoken');
const {
    User,
} = require('../models');

const getUser = async (token) => {
    try {
        if (token) {
            const id = jwt.verify(token.split(' ')[1], process.env.SESSION_SECRET).id
            const user = await User.findById(id);
            return user
        }
        return null
    } catch (err) {
        return null
    }
}

module.exports = getUser
