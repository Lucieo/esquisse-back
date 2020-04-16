const { app } = require('../server');
const request = require('supertest')(app);
const { setupConnection, dropDatabase, closeConnection } = require('./db');
const { getJwt, authenticatedRequest, endpoint } = require('./helpers');

describe('Graphql Mutations', () => {
    let connection;
    let db;

    beforeAll(async () => {
        const result = await setupConnection();
        connection = result.connection;
        db = result.db;
    })
    beforeEach(() => dropDatabase(db))
    afterAll(() => closeConnection(connection))

    describe('createGame', () => {
        it('échoue si l\'utilisateur n\'est pas authentifié', () => {
            const query = `mutation {
                createGame {
                    id
                }
            }`
            const req = request
                .post(endpoint)
                .send({
                    query
                });
            return req.then(res => {
                expect(res.status).toEqual(200);
                expect(res.body.errors[0].message).toMatch("Cannot read property 'id' of null");
            });
        })

        it('retourne l \'id de la partie', async () => {
            const query = `mutation {
                createGame {
                    id
                }
            }`;
            const decoratedRequest = await authenticatedRequest(request)
            const req = decoratedRequest()
                .send({
                    query
                })

            return req.then(res => {
                expect(res.status).toEqual(200);
                expect(res.body.data.createGame.id).toMatch(/[a-z0-9]*/);
            })
        })
    })

    describe('changeGameStatus', () => {
        it('n\'accepte pas un statut inconnu', () => {
            const gameId = '5e98298d16c246ba1b613816';
            const query = `mutation {
                changeGameStatus(gameId: "${gameId}", newStatus: lol) {
                    id
                }
            }`
            const req = request
                .post(endpoint)
                .send({
                    query
                });
            return req.then(res => {
                expect(res.status).toEqual(400);
                expect(res.body.errors[0].message).toMatch("Expected type GameStatus");
            });
        })

        it('erreur Entity Not Found si la partie n\'existe pas', () => {
            const gameId = '5e98298d16c246ba1b613816';
            const query = `mutation {
                changeGameStatus(gameId: "${gameId}", newStatus: new) {
                    id
                }
            }`
            const req = request
                .post(endpoint)
                .send({
                    query
                });
            return req.then(res => {
                expect(res.status).toEqual(200);
                expect(res.body.errors[0].message).toMatch("Entity Not Found");
            });
        })

        // FIXME le test provoque un warning de Jest
        it('MaJ du statut', async () => {
            // given
            const createGame = async (jwt) => {
                const query = `mutation {
                    createGame {
                        id
                    }
                }`;
                const res = await (request
                    .post(endpoint)
                    .set('Authorization', `Bearer ${jwt}`)
                    .send({
                        query
                    }))
                return res.body.data.createGame;
            };
            const jwt = await getJwt(request);
            const { id: gameId } = await createGame(jwt);

            // when
            const newStatus = 'active';
            const query = `mutation {
                changeGameStatus(gameId: "${gameId}", newStatus: ${newStatus}) {
                    status
                }
            }`
            const res = await (request
                .post(endpoint)
                .set('Authorization', `Bearer ${jwt}`)
                .send({
                    query
                }));

            // then
            expect(res.status).toEqual(200);
            expect(res.body.data.changeGameStatus.status).toEqual(newStatus);
        })
    })

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
