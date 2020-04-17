const { app } = require('../server');
const request = require('supertest')(app);
const { setupConnection, dropDatabase, closeConnection } = require('./db');
const { getJwt, authenticatedRequest, endpoint } = require('./helpers');
const { DELAY } = require('../config');

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
        it('échoue si l\'utilisateur n\'est pas authentifié', async () => {
            const query = `mutation {
                createGame {
                    id
                }
            }`
            const res = await request
                .post(endpoint)
                .send({
                    query
                });

            expect(res.status).toEqual(200);
            expect(res.body.errors[0].message).toMatch("Cannot read property 'id' of null");
        })

        it('retourne l \'id de la partie et la confiugration par défaut', async () => {
            const query = `mutation {
                createGame {
                    id
                    configuration {
                        timers {
                            init
                        }
                    }
                }
            }`;

            const decoratedRequest = await authenticatedRequest(request)
            const res = await (decoratedRequest()
                .send({
                    query
                }));

            expect(res.status).toEqual(200);
            const { createGame } = res.body.data;
            expect(createGame.id).toMatch(/[a-z0-9]*/);
            expect(createGame.configuration.timers.init).toEqual(DELAY.INIT);
        })

        it('accepte des paramètres de configuration', async () => {
            const initTimerValue = 1000;
            const query = `mutation {
                createGame(configuration: {timers: { init: ${initTimerValue} }}) {
                    id
                    configuration {
                        timers {
                            init
                            drawing
                        }
                    }
                }
            }`;

            const decoratedRequest = await authenticatedRequest(request)
            const res = await (decoratedRequest()
                .send({
                    query
                }));

            expect(res.status).toEqual(200);
            const { createGame } = res.body.data;
            expect(createGame.id).toMatch(/[a-z0-9]*/);
            expect(createGame.configuration.timers.init).toEqual(initTimerValue);
            expect(createGame.configuration.timers.drawing).toEqual(DELAY.DRAWING_MODE);
        })
    })

    describe('changeGameStatus', () => {
        it('n\'accepte pas un statut inconnu', async () => {
            const gameId = '5e98298d16c246ba1b613816';
            const query = `mutation {
                changeGameStatus(gameId: "${gameId}", newStatus: lol) {
                    id
                }
            }`;

            const res = await request
                .post(endpoint)
                .send({
                    query
                });

            expect(res.status).toEqual(400);
            expect(res.body.errors[0].message).toMatch("Expected type GameStatus");
        })

        it('erreur Entity Not Found si la partie n\'existe pas', async () => {
            const gameId = '5e98298d16c246ba1b613816';
            const query = `mutation {
                changeGameStatus(gameId: "${gameId}", newStatus: new) {
                    id
                }
            }`
            const res = await (request
                .post(endpoint)
                .send({
                    query
                }));

            expect(res.status).toEqual(200);
            expect(res.body.errors[0].message).toMatch("Entity Not Found");
        })

        // FIXME le test provoque un warning de Jest
        // peut-être du aux "setTimeout" dans les resolvers
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
