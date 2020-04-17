const {
 resolvers: {
     Mutation: {
         submitPage,
         changeGameStatus
     }
 },
} = require('../../schema/resolvers')
const { DELAY } = require('../../config')
const { Game, Sketchbook, Page } = require('../../models');
const pubsub = require('../../schema/pubsub');

jest.mock('../../schema/pubsub', () => ({
    publish: jest.fn()
}))

jest.mock('../../models', () => ({
    Game: {
        checkCompletedTurn: jest.fn(),
        findByIdAndPopulate: jest.fn()
    },
    Sketchbook: function Sketchbook({ creator, gameId }) {
        this.creator = creator;
        this.gameId = gameId;
    },
    Page: function Page() {
        this.id = 'pageId'
    },
    GAME_STATUS: { ACTIVE: 'active' }
}))

describe('Mutations', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    })

    describe('changeGameStatus', () => {
        const mockGameSave = jest.fn();
        const gameId = 'gameId';

        it('ne fait rien si le jeu a déjà le statut', async () => {
            const status = 'over';
            const game = {
                id: gameId,
                status,
                save: mockGameSave,
            };
            const user = {}
            Game.findByIdAndPopulate.mockResolvedValue(game)
            const result = await changeGameStatus({}, { gameId, newStatus: status }, { user })
            expect(result).toEqual(game);

            expect(Game.findByIdAndPopulate).toHaveBeenCalledTimes(1);
            expect(Game.findByIdAndPopulate).toHaveBeenCalledWith(gameId);

            expect(mockGameSave).toHaveBeenCalledTimes(0);
            expect(pubsub.publish).toHaveBeenCalledTimes(0);
        })

        it('seul le créateur du jeu peut effectuer cette action', async () => {
            const game = {
                id: gameId,
                status: 'new',
                save: mockGameSave,
            };
            const user = {
                isCreator: jest.fn(() =>  false)
            }
            Game.findByIdAndPopulate.mockResolvedValue(game)
            await changeGameStatus({}, { gameId, newStatus: 'active' }, { user })

            expect(Game.findByIdAndPopulate).toHaveBeenCalledTimes(1);
            expect(Game.findByIdAndPopulate).toHaveBeenCalledWith(gameId);
            expect(user.isCreator).toHaveBeenCalledTimes(1);
            expect(user.isCreator).toHaveBeenCalledWith(game);

            expect(mockGameSave).toHaveBeenCalledTimes(0);
            expect(pubsub.publish).toHaveBeenCalledTimes(0);
        })

        it('MaJ du statut du jeu', async () => {
            const game = {
                id: gameId,
                status: 'new',
                save: mockGameSave,
            };
            const newStatus = 'over';
            const expectedResult = {
                ...game,
                status: newStatus
            };
            const user = {
                isCreator: jest.fn(() =>  true)
            }
            Game.findByIdAndPopulate.mockResolvedValue(game)
            const result = await changeGameStatus({}, { gameId, newStatus }, { user })
            expect(result).toEqual(expectedResult);

            expect(mockGameSave).toHaveBeenCalledTimes(1);
        })

        it('notifie les autres joueurs', async () => {
            const game = {
                id: gameId,
                status: 'new',
                save: mockGameSave,
            };
            const newStatus = 'over';
            const expectedResult = {
                ...game,
                status: newStatus
            };
            const user = {
                isCreator: jest.fn(() =>  true)
            }
            Game.findByIdAndPopulate.mockResolvedValue(game)
            await changeGameStatus({}, { gameId, newStatus }, { user })

            expect(pubsub.publish).toHaveBeenCalledTimes(1);
            expect(pubsub.publish).toHaveBeenCalledWith('GAME_UPDATE', { gameUpdate: expectedResult });
        })

        describe('quand le nouveau statut est "active"', () => {
            beforeEach(() => {
                jest.useFakeTimers();
            })

            it('crée un nouveau sketchbook par joueur', async () => {
                const mockSketchbookSave = jest.fn()
                const players = [{}, {}, {}];
                const game = {
                    id: gameId,
                    status: 'new',
                    save: mockGameSave,
                    players,
                    sketchbooks: [],
                    configuration: {
                        timers: {
                            init: 0,
                            drawing: 1,
                            guessing: 2
                        }
                    }
                };
                const newStatus = 'active';
                const user = {
                    isCreator: jest.fn(() =>  true)
                }
                Game.findByIdAndPopulate.mockResolvedValue(game);
                Sketchbook.prototype.save = mockSketchbookSave;
                await changeGameStatus({}, { gameId, newStatus }, { user })

                expect(mockSketchbookSave).toHaveBeenCalledTimes(3);
                expect(game.sketchbooks.length).toEqual(3);
            })

            it('planifie une notification TIME_TO_SUBMIT', async () => {
                const mockSketchbookSave = jest.fn()
                const players = [{}, {}, {}];
                const game = {
                    id: gameId,
                    status: 'new',
                    save: mockGameSave,
                    players,
                    sketchbooks: [],
                    configuration: {
                        timers: {
                            init: 0,
                            guessing: 1,
                            drawing: 2
                        }
                    },
                };
                const newStatus = 'active';
                const user = {
                    isCreator: jest.fn(() =>  true)
                }
                Game.findByIdAndPopulate.mockResolvedValue(game);
                Sketchbook.prototype.save = mockSketchbookSave;
                await changeGameStatus({}, { gameId, newStatus }, { user })

                expect(setTimeout).toHaveBeenCalledWith(
                    expect.any(Function),
                    game.configuration.timers.init
                )
            });
        })
    });

    describe('submitPage', () => {
        const sketchbookId = 'sketchbookId';
        const content = 'fake-content';
        const pageType = 'pageType';
        const gameId = 'gameId';
        const game = {
            _id: gameId,
            turn: 1,
            configuration: {
                timers: {
                    init: 0,
                    guessing: 1,
                    drawing: 2
                }
            },
        };
        const user = {
            name: 'fake-user'
        }
        const mockSketchbookSave = jest.fn();
        const mockPageSave = jest.fn();
        Page.findOne = jest.fn();
        Page.prototype.save = mockPageSave;

        beforeEach(() => {
            jest.resetAllMocks();
            jest.useFakeTimers();
        })

        it('crée une page si elle n\'existe pas', async () => {
            Page.findOne.mockResolvedValue(null);
            Game.checkCompletedTurn.mockResolvedValue({})
            const sketchbook = {
                save: mockSketchbookSave,
                pages: []
            }
            Sketchbook.findById = jest.fn().mockResolvedValue(sketchbook)
            const result = await submitPage({}, { sketchbookId, content, pageType, gameId}, { user })
            expect(result).toEqual({ id: 'pageId' })

            expect(Page.findOne).toHaveBeenCalledTimes(1)
            expect(Page.findOne).toHaveBeenCalledWith({
                creator: user,
                sketchbook: sketchbookId
            })

            expect(mockPageSave).toHaveBeenCalledTimes(1)
            expect(sketchbook.pages.length).toEqual(1)
            expect(mockSketchbookSave).toHaveBeenCalledTimes(1)
        })

        it('si la page existe, lance la vérification de fin de tour', async () => {
            Page.findOne.mockResolvedValue({
                id: 1
            });
            Game.checkCompletedTurn.mockResolvedValue({})

            const result = await submitPage({}, { sketchbookId, content, pageType, gameId}, { user })
            expect(result).toEqual({ id: 1 })

            expect(Game.checkCompletedTurn).toHaveBeenCalledTimes(1)
            expect(Game.checkCompletedTurn).toHaveBeenCalledWith(gameId)
        })

        it('si le tour est fini, planifie un nouveau TIME_TO_SUBMIT', async () => {
            Page.findOne.mockResolvedValue({ id: 1 });
            Game.checkCompletedTurn.mockResolvedValue({
                isTurnCompleted: true,
                game: {
                    ...game,
                    isCurrentlyInDrawingMode: true
                }
            })

            const result = await submitPage({}, { sketchbookId, content, pageType, gameId}, { user })
            expect(result).toEqual({ id: 1 })

            expect(setTimeout).toHaveBeenCalledWith(
                expect.any(Function),
                game.configuration.timers.drawing
            )
        })

        it('si le tour est fini, lance un évènement GAME_UPDATE', async () => {
            Page.findOne.mockResolvedValue({id: 1});
            Game.checkCompletedTurn.mockResolvedValue({
                isTurnCompleted: true,
                game
            })

            const result = await submitPage({}, { sketchbookId, content, pageType, gameId}, { user })
            expect(result).toEqual({ id: 1 })

            expect(pubsub.publish).toHaveBeenCalledTimes(1)
            expect(pubsub.publish).toHaveBeenNthCalledWith(1, 'GAME_UPDATE', { gameUpdate: game })
        })
    })
})
