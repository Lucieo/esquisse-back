const cron = require('node-cron');
const Game = require('./models/game');
const Sketchbook = require('./models/sketchbook');
const Page = require('./models/page');

// TODO utiliser ttl indexes: https://docs.mongodb.com/manual/core/index-ttl/
//Guest Posts Cleaning Cron
exports.gameCleaningJob = ()=>{
    cron.schedule("*/30 * * * *", async function(){
        console.log("CLEANING GAMES CRON")
        const less30Minutes = new Date()
        less30Minutes.setMinutes( less30Minutes.getMinutes() - 30 );
        await Game.remove({createdAt:{"$lt":less30Minutes}})
        await Sketchbook.remove({createdAt:{"$lt":less30Minutes}});
        await Page.remove({createdAt:{"$lt":less30Minutes}});
    });
}