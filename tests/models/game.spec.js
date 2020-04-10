const { Game, User, Sketchbook, Page } = require('../../models');
const { pubsub } = require('../../schema');

jest.mock('../../schema', () => ({
    pubsub: {
        publish: jest.fn()
    }
}))

const mockSave = jest.fn();
const mockIsOver = jest.fn();
const mockTurnIsOver = jest.fn();
const mockGameInstance = {
    save: mockSave,
    isOver: mockIsOver,
    currentTurnIsOver: mockTurnIsOver
}
const mockGameQuery = {
    populate: () => mockGameQuery,
    then: (resolve) => resolve(mockGameInstance),
}
const mockFindById = jest.fn();
Game.findById = mockFindById;

describe('Game', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockFindById.mockReturnValue(mockGameQuery)
        mockGameInstance.sketchbooks = [];
        mockGameInstance.players = [];
        mockGameInstance.status = 'new';
    })

    describe('publishTimeToSubmit', () => {
        it('publie TIME_TO_SUBMIT', async () => {
            await Game.publishTimeToSubmit({_id: 'id', turn: 1}, 1)
            expect(pubsub.publish).toHaveBeenCalledTimes(1)
            expect(pubsub.publish).toHaveBeenCalledWith('TIME_TO_SUBMIT', {
                timeToSubmit: {
                    id: 'id',
                    turn: 0
                }
            })
        })

        it('appelé 1 seule fois par partie-tour', async () => {
            await Promise.all([
                Game.publishTimeToSubmit({_id: 'a', turn: 1}, 0),
                Game.publishTimeToSubmit({_id: 'a', turn: 1}, 0),
                Game.publishTimeToSubmit({_id: 'a', turn: 2}, 0),
                Game.publishTimeToSubmit({_id: 'a', turn: 2}, 0),
                Game.publishTimeToSubmit({_id: 'b', turn: 3}, 0),
                Game.publishTimeToSubmit({_id: 'b', turn: 3}, 0),
            ])
            expect(pubsub.publish).toHaveBeenCalledTimes(3)
            expect(pubsub.publish).toHaveBeenNthCalledWith(1, 'TIME_TO_SUBMIT', {
                timeToSubmit: {
                    id: 'a',
                    turn: 0
                }
            })
            expect(pubsub.publish).toHaveBeenNthCalledWith(2, 'TIME_TO_SUBMIT', {
                timeToSubmit: {
                    id: 'a',
                    turn: 1
                }
            })
            expect(pubsub.publish).toHaveBeenNthCalledWith(3, 'TIME_TO_SUBMIT', {
                timeToSubmit: {
                    id: 'b',
                    turn: 2
                }
            })
        })
    })

    describe('checkCompletedTurn', () => {
        const mockTimeToSubmit = jest.fn();
        let originalPublishTimeToSubmit;
        beforeAll(() => {
            originalPublishTimeToSubmit = Game.publishTimeToSubmit;
            Game.publishTimeToSubmit = mockTimeToSubmit;
        })

        afterAll(() => {
            Game.publishTimeToSubmit = originalPublishTimeToSubmit
        })

        describe('tous les sketchbooks ne sont pas remplis pour le tour', () => {
            it('ne fait rien', async () => {
                mockTurnIsOver.mockReturnValue(false)
                const gameId = 'gameId';
                await Game.checkCompletedTurn(gameId)

                expect(mockFindById).toHaveBeenCalledTimes(1);
                expect(mockFindById).toHaveBeenCalledWith(gameId);

                expect(mockTimeToSubmit).toHaveBeenCalledTimes(0);
                expect(mockSave).toHaveBeenCalledTimes(0);
                expect(pubsub.publish).toHaveBeenCalledTimes(0);
            })
        })

        describe('les sketchbooks sont remplis pour le tour', () => {
            beforeEach(() => {
                mockTurnIsOver.mockReturnValue(true)
            })

            it('incrémentation du tour', async () => {
                const gameId = 'gameId';
                await Game.checkCompletedTurn(gameId)

                expect(mockFindById).toHaveBeenCalledTimes(1);
                expect(mockFindById).toHaveBeenCalledWith(gameId);

                expect(mockTimeToSubmit).toHaveBeenCalledTimes(1);
                expect(mockTimeToSubmit).toHaveBeenCalledWith(mockGameInstance);

                expect(mockSave).toHaveBeenCalledTimes(1);
                expect(pubsub.publish).toHaveBeenCalledTimes(1);
                expect(pubsub.publish).toHaveBeenCalledWith(
                    'GAME_UPDATE',
                    { gameUpdate: mockGameInstance }
                );
            })

            it('le jeu est fini quand chaque sketchbook est passé par chaque joueur', async () => {
                mockGameInstance.isOver.mockReturnValue(true)
                const gameId = 'gameId';
                await Game.checkCompletedTurn(gameId)

                expect(mockGameInstance.status).toEqual('over');
            })

            it('le jeu n\'est pas fini tant que chaque sketchbook n\'est pas passé par chaque joueur', async () => {
                mockGameInstance.isOver.mockReturnValue(false)
                const gameId = 'gameId';
                await Game.checkCompletedTurn(gameId)

                expect(mockGameInstance.status).toEqual('new');
            })
        })
    })

    describe('methods', () => {
        describe('isOver', () => {
            it('retourne true quand le jeu est fini', () => {
                const game = new Game({
                    turn: 1,
                    players: [
                        new User()
                    ]
                })
                expect(game.isOver()).toBe(true)
            })

            it('retourne false quand le jeu n\'est pas fini', () => {
                const game = new Game({
                    turn: 0,
                    players: [
                        new User()
                    ]
                })
                expect(game.isOver()).toBe(false)
            })
        })

        describe('currentTurnIsOver', () => {
            it('retourne true quand le tour est fini', () => {
                const game = new Game({
                    turn: 0,
                    sketchbooks: [
                        new Sketchbook({
                            pages: [new Page()]
                        })
                    ]
                })
                expect(game.currentTurnIsOver()).toBe(true)
            })

            it('retourne false quand le tour n\'est pas fini', () => {
                const game = new Game({
                    turn: 0,
                    sketchbooks: [
                        new Sketchbook({
                            pages: []
                        })
                    ]
                })
                expect(game.currentTurnIsOver()).toBe(false)
            })
        })
    })
})
