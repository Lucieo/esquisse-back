const cron = require('node-cron');
const Game = require('./models/game');
const Sketchbook = require('./models/sketchbook');
const Page = require('./models/page');


//Guest Posts Cleaning Cron
exports.gameCleaningJob = ()=>{
    cron.schedule("30 05 * * *", async function(){
        console.log("Cleaning games cron starting")
        const yesterday = new Date(Date.now() - 1*24*60*60 * 1000)
        Game.remove( { created_at : {"$lt" : yesterday } });
        Sketchbook.remove( { created_at : {"$lt" : yesterday } });
        Page.remove( { created_at : {"$lt" : yesterday } });
    });
}