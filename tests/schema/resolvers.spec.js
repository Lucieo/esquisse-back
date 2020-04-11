const {
 resolvers: {
     Query: {
        currentUser,
        getGameInfo
     },
     Mutation: {
         submitPage
     }
 },
 memoizedPublishTimeToSubmit
} = require('../../schema/resolvers')
const { DELAY } = require('../../config')
const { Game, Sketchbook, Page } = require('../../models');
const pubsub = require('../../schema/pubsub');

jest.mock('../../schema/pubsub', () => ({
    publish: jest.fn()
}))

jest.mock('../../models', () => ({
    Game: {
        findByIdAndPopulate: jest.fn(),
        checkCompletedTurn: jest.fn()
    },
    Sketchbook: {
        findById: jest.fn()
    },
    Page: function Page() {
        this.id = 'pageId'
    }
}))

describe('memoizedPublishTimeToSubmit', () => {
    beforeEach(() => {
        jest.resetAllMocks()
    })

    it('publie TIME_TO_SUBMIT', async () => {
        const turn = 1
        await memoizedPublishTimeToSubmit({gameId: 'id', turn }, 1)
        expect(pubsub.publish).toHaveBeenCalledTimes(1)
        expect(pubsub.publish).toHaveBeenCalledWith('TIME_TO_SUBMIT', {
            timeToSubmit: {
                id: 'id',
                turn
            }
        })
    })

    it('appelé 1 seule fois par partie-tour', async () => {
        await Promise.all([
            memoizedPublishTimeToSubmit({gameId: 'a', turn: 1}, 0),
            memoizedPublishTimeToSubmit({gameId: 'a', turn: 1}, 0),
            memoizedPublishTimeToSubmit({gameId: 'a', turn: 2}, 0),
            memoizedPublishTimeToSubmit({gameId: 'a', turn: 2}, 0),
            memoizedPublishTimeToSubmit({gameId: 'b', turn: 3}, 0),
            memoizedPublishTimeToSubmit({gameId: 'b', turn: 3}, 0),
        ])
        expect(pubsub.publish).toHaveBeenCalledTimes(3)
        expect(pubsub.publish).toHaveBeenNthCalledWith(1, 'TIME_TO_SUBMIT', {
            timeToSubmit: {
                id: 'a',
                turn: 1
            }
        })
        expect(pubsub.publish).toHaveBeenNthCalledWith(2, 'TIME_TO_SUBMIT', {
            timeToSubmit: {
                id: 'a',
                turn: 2
            }
        })
        expect(pubsub.publish).toHaveBeenNthCalledWith(3, 'TIME_TO_SUBMIT', {
            timeToSubmit: {
                id: 'b',
                turn: 3
            }
        })
    })
})

describe('Query', () => {
    describe('currentUser', () => {
        it('throws if user is not in context', async () => {
            await expect(currentUser({}, {}, {})).rejects.toThrow(
                new Error('Not Authenticated')
            )
        })
    })

    describe('getGameInfo', () => {
        it('returns a Game', async () => {
            const gameId = 'gameId'
            const game = { _id: gameId };
            Game.findByIdAndPopulate.mockResolvedValue(game)
            const result = await getGameInfo({}, { gameId }, {});

            expect(result).toEqual(game)
            expect(Game.findByIdAndPopulate).toHaveBeenCalledTimes(1)
            expect(Game.findByIdAndPopulate).toHaveBeenCalledWith(gameId)
        })
    })
})

describe('Mutations', () => {
    describe('submitPage', () => {
        const sketchbookId = 'sketchbookId';
        const content = 'fake-content';
        const pageType = 'pageType';
        const gameId = 'gameId';
        const game = { _id: gameId, turn: 1 };
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
            const sketchbook = {
                save: mockSketchbookSave,
                pages: []
            }
            Sketchbook.findById.mockResolvedValue(sketchbook)
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
            Page.findOne.mockResolvedValue({});
            Game.checkCompletedTurn.mockResolvedValue({})

            const result = await submitPage({}, { sketchbookId, content, pageType, gameId}, { user })
            expect(result).toEqual({ id: null })

            expect(Game.checkCompletedTurn).toHaveBeenCalledTimes(1)
            expect(Game.checkCompletedTurn).toHaveBeenCalledWith(gameId)
        })

        it('si le tour est fini, planifie un nouveau TIME_TO_SUBMIT', async () => {
            Page.findOne.mockResolvedValue({});
            Game.checkCompletedTurn.mockResolvedValue({
                isTurnCompleted: true,
                game: {
                    ...game,
                    isCurrentlyInDrawingMode: true
                }
            })

            const result = await submitPage({}, { sketchbookId, content, pageType, gameId}, { user })
            expect(result).toEqual({ id: null })

            expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), DELAY.DRAWING_MODE)
        })

        it('si le tour est fini, lance un évènement GAME_UPDATE', async () => {
            Page.findOne.mockResolvedValue({});
            Game.checkCompletedTurn.mockResolvedValue({
                isTurnCompleted: true,
                game
            })

            const result = await submitPage({}, { sketchbookId, content, pageType, gameId}, { user })
            expect(result).toEqual({ id: null })

            expect(pubsub.publish).toHaveBeenCalledTimes(1)
            expect(pubsub.publish).toHaveBeenNthCalledWith(1, 'GAME_UPDATE', { gameUpdate: game })
        })
    })
})
