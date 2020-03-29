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
type Sketchbook {
    id: ID
    creator: ID
    pages: [Page]
}
type Page{
    content: String
    pageType: String
    creator: ID
}
type Game{
    id: ID
    status: String
    creator: ID
    players: [User]
    sketchbooks: [ID]
    turn: Int
}
type CreatedGame{
    id:ID
}
type PlayerModifyResponse{
    player: User,
    id: ID
}
type submitPageResponse{
    id: ID
}
type Query {
    currentUser: User!,
    getGameInfo(gameId: ID): Game!
    getSketchbookInfo(sketchbookId: ID!): Sketchbook!
}
type Mutation {
    signup(name: String!, email: String!, password: String!): User!
    login(email: String!, password: String!): LoginResponse!,
    modifyUser(name: String!, icon: String!, iconColor: String!): User!
    createGame: CreatedGame
    joinGame(gameId: ID!): Game
    changeGameStatus(gameId: ID!, newStatus: String!): Game
    submitPage(sketchBookId: ID!, gameId: ID!, content: String!, pageType: String!): submitPageResponse!
}
type Subscription {
    playerJoined(gameId: ID!): PlayerModifyResponse
    gameUpdate(gameId: ID!): Game
}

`;

module.exports = typeDefs;