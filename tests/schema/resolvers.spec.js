const {
 resolvers: {
     Query: {
        currentUser,
        getGameInfo
     }
 },
 memoizedPublishTimeToSubmit
} = require('../../schema/resolvers')
const { Game } = require('../../models');
const pubsub = require('../../schema/pubsub');

jest.mock('../../schema/pubsub', () => ({
    publish: jest.fn()
}))

jest.mock('../../models', () => ({
    Game: {
        findByIdAndPopulate: jest.fn()
    }
}))

describe('memoizedPublishTimeToSubmit', () => {
    beforeEach(() => {
        jest.resetAllMocks()
    })

    it('publie TIME_TO_SUBMIT', async () => {
        await memoizedPublishTimeToSubmit({gameId: 'id', turn: 1}, 1)
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
