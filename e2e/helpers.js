const debug = require('debug')('esquisse:e2e:helpers')

const endpoint = '/graphql';
const getJwt = (request) => {
    const user = {
        name: "user1234",
        email: "user@example.com",
        password: "Passw0rd!"
    }
    const signupQuery = `mutation {
        signup(name: "${user.name}", email: "${user.email}", password: "${user.password}") {
            name
        }
    }`
    const loginQuery = `mutation {
        login(email: "${user.email}", password: "${user.password}") {
            token
        }
    }`;
    return request
        .post(endpoint)
        .send({
            query: signupQuery
        })
        .then((res) => {
            debug('signup', res.body);
            return request
                .post(endpoint)
                .send({
                    query: loginQuery
                })
                .then(res => {
                    debug('login', res.body);
                    return res.body.data.login.token;
                })
        })
};

module.exports = {
    endpoint,
    getJwt,
    authenticatedRequest(request) {
        return getJwt(request)
            .then((token) => (
                () => request
                    .post(endpoint)
                    .set('Authorization', `Bearer ${token}`)
            ));
    }
}
