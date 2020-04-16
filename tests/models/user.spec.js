const  {
    Game,
    User
} = require('../../models');

describe('User', () => {
    describe('isCreator', () => {
        it('works', () => {
            const user = new User();
            const creator = new User();
            const game = new Game({ creator: creator.id });
            expect(user.isCreator(game)).toEqual(false);
            expect(creator.isCreator(game)).toEqual(true);
        })
    })
})
