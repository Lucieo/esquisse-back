const { gql } = require("apollo-server-express");

const typeDefs = gql`
    scalar Date
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
    type Page {
        content: String
        pageType: String
        creator: User
    }
    type Game {
        id: ID
        status: String
        creator: ID
        players: [User]
        sketchbooks: [Sketchbook]
        turn: Int
        timer: Date
    }
    type CreatedGame {
        id: ID
    }
    type PlayerModifyResponse {
        players: [User]
        gameId: ID
        creator: ID
    }
    type submitPageResponse {
        id: ID
    }
    type allGamesResponse {
        sketchbooks: [Sketchbook]
        id: ID
    }
    type debugGameResponse {
        gameId: ID
    }
    type Query {
        currentUser: User!
        getGameInfo(gameId: ID): Game!
        getSketchbookInfo(sketchbookId: ID!): Sketchbook!
        getAllSketchbooks(gameId: ID!): [Sketchbook]
        getLastUserGames: [allGamesResponse]
    }
    type Mutation {
        signup(name: String!, email: String!, password: String!): User!
        login(email: String!, password: String!): LoginResponse!
        modifyUser(name: String!, icon: String!, iconColor: String!): User!
        createGame: CreatedGame
        joinGame(gameId: ID!): Game
        leaveGame(gameId: ID!): Game
        changeGameStatus(gameId: ID!, newStatus: String!): Game
        submitPage(
            sketchbookId: ID!
            gameId: ID!
            content: String!
            pageType: String!
        ): submitPageResponse!
        debugGame(gameId: ID!): debugGameResponse
    }
    type Subscription {
        playerUpdate(gameId: ID!): PlayerModifyResponse
        gameUpdate(gameId: ID!): Game
        timeToSubmit(gameId: ID!): submitPageResponse
    }
`;

module.exports = typeDefs;
