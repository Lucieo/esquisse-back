const { Game, User, Sketchbook, Page, GAME_STATUS } = require('../../models');

const mockSave = jest.fn();
const mockIsOver = jest.fn();
const mockTurnIsOver = jest.fn();
const mockGameInstance = {
    save: mockSave,
    isOver: mockIsOver,
    currentTurnIsOver: mockTurnIsOver
}
const mockPopulate = jest.fn()
const mockGameQuery = {
    populate: mockPopulate,
    then: (resolve) => resolve(mockGameInstance),
}
const mockFindById = jest.fn();
Game.findById = mockFindById;

describe('Game', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockFindById.mockReturnValue(mockGameQuery)
        mockPopulate.mockReturnValue(mockGameQuery)
        mockGameInstance.sketchbooks = [];
        mockGameInstance.players = [];
        mockGameInstance.status = GAME_STATUS.NEW;
    })

    describe('findByIdAndPopulate', () => {
        it('findById + populate sketchbooks and users', async () => {
            const res = await Game.findByIdAndPopulate('gameId')
            expect(res).toEqual(mockGameInstance)

            expect(mockFindById).toHaveBeenCalledTimes(1)
            expect(mockFindById).toHaveBeenCalledWith('gameId')

            expect(mockPopulate).toHaveBeenCalledTimes(2)
            expect(mockPopulate).toHaveBeenNthCalledWith(1, 'sketchbooks')
            expect(mockPopulate).toHaveBeenNthCalledWith(2, 'players')
        })
    })

    describe('checkCompletedTurn', () => {
        describe('tous les sketchbooks ne sont pas remplis pour le tour', () => {
            it('ne fait rien', async () => {
                mockTurnIsOver.mockReturnValue(false)
                const gameId = 'gameId';
                await Game.checkCompletedTurn(gameId)

                expect(mockFindById).toHaveBeenCalledTimes(1);
                expect(mockFindById).toHaveBeenCalledWith(gameId);

                expect(mockSave).toHaveBeenCalledTimes(0);
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

                expect(mockSave).toHaveBeenCalledTimes(1);
            })

            it('retourne l\'instance du jeu et un flag pour indiquer qu\'on passe au tour suivant', async () => {
                mockGameInstance.isOver.mockReturnValue(true)
                const gameId = 'gameId';
                const result = await Game.checkCompletedTurn(gameId)

                expect(result).toEqual({ isTurnCompleted: true, game: mockGameInstance });
            })

            it('le jeu est fini quand chaque sketchbook est passé par chaque joueur', async () => {
                mockGameInstance.isOver.mockReturnValue(true)
                const gameId = 'gameId';
                await Game.checkCompletedTurn(gameId)

                expect(mockGameInstance.status).toEqual(GAME_STATUS.OVER);
            })

            it('le jeu n\'est pas fini tant que chaque sketchbook n\'est pas passé par chaque joueur', async () => {
                mockGameInstance.isOver.mockReturnValue(false)
                const gameId = 'gameId';
                await Game.checkCompletedTurn(gameId)

                expect(mockGameInstance.status).toEqual(GAME_STATUS.NEW);
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
