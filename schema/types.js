const {gql} = require('apollo-server-express');

const typeDefs = gql`
type User {
    id: ID
    name: String
    email: String
    icon: String
    iconColor: String
}
type LoginResponse {
    token: String
    user: User
}
type Game{
    id: ID,
    status: String,
    creator: ID,
    players: [ID]
}
type CreatedGame{
    gameId:ID
}
type Query {
    currentUser: User!
}
type Mutation {
    signup(name: String!, email: String!, password: String!): User!
    login(email: String!, password: String!): LoginResponse!,
    modifyUser(name: String!, icon: String!, iconColor: String!): User!
    createGame: CreatedGame,
    joinGame(gameId: ID!): Game
}
type Subscription {
    playersJoined: [User]
}

`;

module.exports = typeDefs;