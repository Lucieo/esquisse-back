module.exports = {
    User: require('./user'),
    ...require('./game'),
    Sketchbook: require('./sketchbook'),
    ...require('./page'),
}
