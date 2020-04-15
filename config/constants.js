module.exports = {
    DELAY: {
        GUESSING_MODE: 60000,
        DRAWING_MODE: 90000
    },
    DEFAULT_EXPIRATION: process.env.NODE_ENV === 'production' ? 900 : 1800
}
