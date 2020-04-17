const {gql} = require('apollo-server-express');
const {
    PAGE_TYPE,
    GAME_STATUS
} = require('../models');

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
    creator: User
}
type GameTimers {
    init: Int
    guessing: Int
    drawing: Int
}
input GameTimersInput {
    init: Int
    guessing: Int
    drawing: Int
}
type GameConfig {
    timers: GameTimers!
}
input GameConfigInput {
    timers: GameTimersInput!
}
type Game{
    id: ID
    status: String
    creator: ID
    players: [User]
    sketchbooks: [Sketchbook]
    turn: Int
    configuration: GameConfig!
}

type CreatedGame {
    id: ID
    configuration: GameConfig!
}
type PlayerModifyResponse{
    players: [User],
    gameId: ID,
    creator: ID
}
type submitPageResponse{
    id: ID
}
type allGamesResponse{
    sketchbooks: [Sketchbook]
    id: ID
}
type Query {
    currentUser: User!,
    getGameInfo(gameId: ID): Game!
    getSketchbookInfo(sketchbookId: ID!): Sketchbook!
    getAllSketchbooks(gameId: ID!): [Sketchbook]
    getLastUserGames: [allGamesResponse]
}
enum GameStatus {
    ${GAME_STATUS.NEW}
    ${GAME_STATUS.ACTIVE}
    ${GAME_STATUS.OVER}
    ${GAME_STATUS.ABANDONNED}
}
enum PageType {
    ${PAGE_TYPE.INIT}
    ${PAGE_TYPE.DRAWING}
    ${PAGE_TYPE.GUESSING}
}
type Mutation {
    signup(name: String!, email: String!, password: String!): User!
    login(email: String!, password: String!): LoginResponse!
    modifyUser(name: String!, icon: String!, iconColor: String!): User!
    createGame(configuration: GameConfigInput): CreatedGame
    joinGame(gameId: ID!): Game
    leaveGame(gameId: ID!): Game
    changeGameStatus(gameId: ID!, newStatus: GameStatus!): Game
    submitPage(sketchbookId: ID!, gameId: ID!, content: String! pageType: PageType!): submitPageResponse!
}
type Subscription {
    playerUpdate(gameId: ID!): PlayerModifyResponse
    gameUpdate(gameId: ID!): Game
    timeToSubmit(gameId: ID!): submitPageResponse
}
`;


module.exports = typeDefs;
