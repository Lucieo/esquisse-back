const { getUser } = require('../server')
const jwt = require('jsonwebtoken');
const { User } = require('../models')

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn()
}))
jest.mock('../models', () => ({
    User: {
        findById: jest.fn()
    }
}))

describe('getUser', () => {
    it('returns user when token is valid', async () => {
        process.env.SESSION_SECRET = 'SESSION_SECRET'
        jwt.verify.mockReturnValue({ id: 'id' })
        User.findById.mockResolvedValue({ id: 'id' })
        const { id } = await getUser('Bearer fake-token');
        expect(id).toEqual('id')

        expect(User.findById).toHaveBeenCalledTimes(1)
        expect(User.findById).toHaveBeenCalledWith('id')

        expect(jwt.verify).toHaveBeenCalledTimes(1)
        expect(jwt.verify).toHaveBeenCalledWith('fake-token', 'SESSION_SECRET')
    })

    it('returns null when no token is provided', async () => {
        expect(await getUser()).toEqual(null)
    })
})
