const Sketchbook = require("./models/sketchbook");
const Page = require("./models/page");
const Game = require("./models/game");
const pubsub = require("./schema/pubsub");

const initializeGame = async (game, newStatus, gameId) => {
    game.status = newStatus;
    const newPagesObj = game.players.map((player, idx) => {
        let pageType;
        if (idx === 0) {
            pageType = "init";
        } else if (idx % 2 === 0) {
            pageType = "guessing";
        } else {
            pageType = "drawing";
        }
        return {
            pageType,
            content: "",
        };
    });

    for (const creator of game.players) {
        const sketchbookPages = await Page.insertMany(newPagesObj);
        const sketchbook = new Sketchbook({
            creator,
            gameId,
        });
        sketchbook.pages = sketchbookPages;
        await sketchbook.save();
        game.sketchbooks.push(sketchbook);
    }
    const delay = process.env.MODE === "TEST" ? 15000 : 60000;
    const timer = new Date();
    timer.setSeconds(timer.getSeconds() + delay / 1000);
    game.timer = timer;
    game.delay = delay;
    await game.save();
    pubsub.publish("GAME_UPDATE", { gameUpdate: game });
    setTimeout(() => {
        pubsub.publish("TIME_TO_SUBMIT", {
            timeToSubmit: { id: gameId },
        });
        setTimeout(() => increaseTurn(gameId), 5000);
    }, delay);
};

const increaseTurn = async (gameId) => {
    const game = await Game.findById(gameId)
        .populate("sketchbooks")
        .populate("players");

    if (+game.turn + 1 > game.players.length - 1) {
        game.status = "over";
    } else {
        game.turn = +game.turn + 1;
        delay = game.turn % 2 == 0 ? 60000 : 90000;
        const timer = new Date();
        timer.setSeconds(timer.getSeconds() + delay / 1000);
        game.timer = timer;
        game.delay = delay;
        setTimeout(() => {
            pubsub.publish("TIME_TO_SUBMIT", {
                timeToSubmit: { id: gameId },
            });
            setTimeout(() => increaseTurn(gameId), 5000);
        }, delay);
    }
    await game.save();
    pubsub.publish("GAME_UPDATE", { gameUpdate: game });
};

module.exports = {
    initializeGame,
};
