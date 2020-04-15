const { app } = require('../server');
const { User } = require('../models');
const request = require('supertest')(app);
const endpoint = '/graphql';

jest.mock('../models', () => ({
    User: function User({ email, name, password }) {
        this.email = email;
        this.name = name;
        this.password = password;
    }
}))

describe('Graphql Mutations', () => {

    describe('signup', () => {
        beforeEach(() => {
            jest.resetAllMocks();
        })

        // TODO
        xit('email must be unique', () => {
        })

        // TODO
        xit('username must be unique', () => {
        })

        it('creates a new user', () => {
            User.find = jest.fn().mockResolvedValue([]);
            User.prototype.save = jest.fn();
            const query = `mutation {
                signup(name: "user1234", email: "user@example.com", password: "Passw0rd!") {
                    name
                }
            }`
            const req = request
                .post(endpoint)
                .send({
                    query
                });
            return req.then(res => {
                expect(res.status).toEqual(200);
                expect(res.body).toEqual({
                    data: {
                        signup: {
                            name: "user1234"
                        }
                    }
                });
            });
        })
    })
})
