const {
 resolvers: {
     Query: {
        currentUser
     }
 }
} = require('../../schema')

describe('Query', () => {
    describe('currentUser', () => {
        it('throws if user is not in context', async () => {
            await expect(currentUser({}, {}, {})).rejects.toThrow(
                new Error('Not Authenticated')
            )
        })
    })
})
