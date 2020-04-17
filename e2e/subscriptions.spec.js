const { app } = require('../server');
const request = require('supertest')(app);
const { authenticatedRequest, endpoint } = require('./helpers');

// TODO
xdescribe('Graphql Subscriptions', () => {
    describe('PLAYER_UPDATE', () => {
        it('on joinGame mutation', () => {

        })
    })
})
