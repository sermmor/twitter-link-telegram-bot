"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var twitter_1 = __importDefault(require("twitter"));
var telegraf_1 = __importDefault(require("telegraf"));
var fs_1 = require("fs");
var utils_1 = require("./utils");
var twitter_data_1 = require("./twitter-data");
var telegram_data_1 = require("./telegram-data");
var networksPath = 'build/networks.json';
var maxNumberOfTweetsWithLinks = 2000;
var tweetsByResquest = 50; // The max is 200. https://developer.twitter.com/en/docs/tweets/timelines/api-reference/get-statuses-home_timeline
var accTweets = [];
var allResponseAcc = [];
fs_1.readFile(networksPath, function (err, data) {
    if (err)
        throw err;
    var userData = JSON.parse(data);
    var telegramBotData = telegram_data_1.extractTelegramData(userData);
    var bot = new telegraf_1.default(telegramBotData.telegram_bot_token); // Also you can use process.env.BOT_TOKEN here.
    // bot.command(`${telegramBotData.bot_tuit_command}`, (ctx: TelegrafContext) => {
    //     const telegramNumberOfTweetsWithLinks = 10; // TODO: Comands with 10, 20, 30,...
    //     sendTuitWithLinksToTelegram(userData, ctx, telegramNumberOfTweetsWithLinks);
    // });
    var numberOfTweetsWithLinks = buildNumberOfTweetsWithLinks(maxNumberOfTweetsWithLinks);
    buildBotCommands(userData, bot, telegramBotData, numberOfTweetsWithLinks);
    bot.launch();
    console.log("> The bot is ready.");
});
var buildNumberOfTweetsWithLinks = function (maxSize) {
    var increment = 10;
    var numberOfTweetsWithLinks = [];
    for (var i = increment; i <= maxSize; i += increment) {
        numberOfTweetsWithLinks.push(i);
    }
    return numberOfTweetsWithLinks;
};
var buildBotCommands = function (userData, bot, telegramBotData, numberOfTweetsWithLinks) {
    numberOfTweetsWithLinks.forEach(function (telegramNumberOfTweetsWithLinks) {
        bot.command("" + telegramBotData.bot_tuit_command + telegramNumberOfTweetsWithLinks, function (ctx) {
            sendTuitWithLinksToTelegram(userData, ctx, telegramNumberOfTweetsWithLinks);
        });
    });
};
var sendTuitWithLinksToTelegram = function (userData, ctx, numberOfTuits) {
    var userTwitterData = twitter_data_1.extractTwitterData(userData);
    accTweets = [];
    allResponseAcc = [];
    getTuitsWithLinks(userTwitterData, numberOfTuits, function (tweets) {
        // Send tweets to Telegram.
        console.log("> The bot has been called.");
        tweets.forEach(function (tw) {
            ctx.reply(tw.username + " (" + tw.handle + ")\n" + tw.message + "\nhttps://twitter.com/" + tw.handle.split('@')[1] + "/status/" + tw.id
            // `${tw.username} (${tw.handle})\n${tw.message}`
            );
        });
    });
};
var getTuitsWithLinks = function (userData, numberOfTweetsWithLinks, onTuitsWithLinksGetted, currentMaxId) {
    var client = new twitter_1.default(userData);
    var params = prepareTwitterResquestParams(currentMaxId);
    client.get('statuses/home_timeline', params, function (error, tweets, response) {
        if (!error) {
            allResponseAcc = allResponseAcc.concat(tweets); // TODO: COMMENT THIS, ONLY FOR DEBUG.
            var allTweets = utils_1.extractMessagesFromTweets(tweets);
            accTweets = accTweets.concat(allTweets);
            var newNumberOfTweets = numberOfTweetsWithLinks - accTweets.length;
            console.log(newNumberOfTweets); // TODO: COMMENT THIS, ONLY FOR DEBUG.
            if (newNumberOfTweets > 0) {
                var newCurrentMaxId = utils_1.getLastTweetId(accTweets);
                getTuitsWithLinks(userData, newNumberOfTweets, onTuitsWithLinksGetted, newCurrentMaxId);
            }
            else {
                debugTweetsInFile();
                onTuitsWithLinksGetted(accTweets);
            }
        }
    });
};
// We are using the modern twitter API https://developer.twitter.com/en/docs/tweets/tweet-updates
var prepareTwitterResquestParams = function (currentMaxId) { return (currentMaxId ? {
    count: tweetsByResquest,
    exclude_replies: true,
    max_id: currentMaxId,
    tweet_mode: 'extended',
} :
    {
        count: tweetsByResquest,
        exclude_replies: true,
        tweet_mode: 'extended',
    }); };
var debugTweetsInFile = function () {
    // const strAllTuits: string = JSON.stringify(accTweets, null, 2); // TODO: COMMENT THIS, ONLY FOR DEBUG.
    // writeFileSync('tuits.json', strAllTuits); // TODO: COMMENT THIS, ONLY FOR DEBUG.
    // const allTuits: string = JSON.stringify(allResponseAcc, null, 2); // TODO: COMMENT THIS, ONLY FOR DEBUG.
    // writeFileSync('tuits.json', allTuits); // TODO: COMMENT THIS, ONLY FOR DEBUG.
    console.log("allTuits: " + allResponseAcc.length + " vs messages: " + accTweets.length);
};
