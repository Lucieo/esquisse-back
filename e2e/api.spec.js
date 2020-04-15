const { app } = require('../server');
const request = require('supertest')(app);

describe('api', () => {
    it('works', () => {
        const query = `query {
            currentUser {
                id
            }
        }`
        const req = request
          .post('/graphql')
          .send();
        return req.then(res => {
          expect(res.status).toEqual(500);
          expect(res.error.text).toMatch('POST body missing.');
        });
    })

    it('works', () => {
        const query = {
            query: `query { currentUser{ id } }`
        };
        const req = request
          .get('/graphql')
          .query(query);
        return req.then(res => {
          expect(res.status).toEqual(200);
          expect(res.body.errors[0].message).toMatch('Not Authenticated');
        });
    })
})
