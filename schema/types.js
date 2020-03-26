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
    players: [User]
}
type CreatedGame{
    gameId:ID
}
type PlayerModifyResponse{
    player: User,
    gameId: ID
}
type GameStatusChangeResponse{
    status: String,
    gameId: ID
}
type Query {
    currentUser: User!,
    getGameInfo(gameId: ID): Game!
}
type Mutation {
    signup(name: String!, email: String!, password: String!): User!
    login(email: String!, password: String!): LoginResponse!,
    modifyUser(name: String!, icon: String!, iconColor: String!): User!
    createGame: CreatedGame
    joinGame(gameId: ID!): Game
    changeGameStatus(gameId: ID!, newStatus: String!): GameStatusChangeResponse
}
type Subscription {
    playerJoined(gameId: ID!): PlayerModifyResponse
    gameStatusChange(gameId: ID!): GameStatusChangeResponse
}

`;

module.exports = typeDefs;