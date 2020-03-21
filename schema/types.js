const {gql} = require('apollo-server-express');

const typeDefs = gql`
type User {
    id: ID
    name: String
    email: String
}
type Query {
    currentUser: User
}
type AuthPayload {
    user: User
}
type Mutation {
    signup(name: String!, email: String!, password: String!): AuthPayload
    login(email: String!, password: String!): AuthPayload
    logout: Boolean
}
`;

module.exports = typeDefs;