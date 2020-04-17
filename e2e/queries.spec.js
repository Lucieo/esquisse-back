const { app } = require('../server');
const request = require('supertest')(app);
const { authenticatedRequest, endpoint } = require('./helpers');

describe('Graphql Queries', () => {
    it('POST requires a body', () => {
        const query = `query {
            currentUser {
                id
            }
        }`
        const req = request
          .post(endpoint)
          .send();
        return req.then(res => {
          expect(res.status).toEqual(500);
          expect(res.error.text).toMatch('POST body missing.');
        });
    })

    describe('currentUser', () => {
        it('requires authentication', () => {
            const query = {
                query: `query { currentUser{ id } }`
            };
            const req = request
              .get(endpoint)
              .query(query);
            return req.then(res => {
              expect(res.status).toEqual(200);
              expect(res.body.errors[0].message).toMatch('Not Authenticated');
            });
        })
    })

})
