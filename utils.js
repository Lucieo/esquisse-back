const Sketchbook = require("./models/sketchbook");
const Page = require("./models/page");

const fillBlanks = (game) => {
    let pageType = "";
    if (+game.turn == 0) {
        pageType = "init";
    } else if (+game.turn % 2 > 0) {
        pageType = "drawing";
    } else {
        pageType = "guessing";
    }
    game.sketchbooks.forEach(async (book, idx) => {
        if (book.pages.length === +game.turn) {
            const pagesMaxIndex = book.pages.length - 1;
            const sketchbook = await Sketchbook.findOne(book);
            let content = "";
            if (pagesMaxIndex - 1 >= 0) {
                const pageId = book.pages[pagesMaxIndex - 1];
                const pageFound = await Page.findOne({ _id: pageId });
                content = pageFound.content;
            }
            const emptyPage = new Page({
                content,
                pageType,
                creator: game.creator,
                sketchbook,
            });
            await emptyPage.save();
            sketchbook.pages.push(emptyPage);
            await sketchbook.save();
        }
    });
};

module.exports = {
    fillBlanks,
};
