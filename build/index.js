"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var twitter_1 = __importDefault(require("twitter"));
var fs_1 = require("fs");
var utils_1 = require("./utils");
var twitter_data_1 = require("./twitter-data");
var networksPath = 'build/networks.json';
var tweetsByResquest = 50;
var accTweets = [];
fs_1.readFile(networksPath, function (err, data) {
    if (err)
        throw err;
    var telegramNumberOfTweetsWithLinks = 10;
    var userData = JSON.parse(data);
    var userTwitterData = twitter_data_1.extractTwitterData(userData);
    accTweets = [];
    getTuitsWithLinks(userTwitterData, telegramNumberOfTweetsWithLinks, function () {
        // TODO: Send tweets to Telegram.
    });
});
var getTuitsWithLinks = function (userData, numberOfTweetsWithLinks, onTuitsWithLinksGetted, currentMaxId) {
    var client = new twitter_1.default(userData);
    var params = prepareTwitterResquestParams(currentMaxId);
    client.get('statuses/home_timeline', params, function (error, tweets, response) {
        if (!error) {
            var allTweets = utils_1.extractMessagesFromTweets(tweets);
            accTweets = accTweets.concat(utils_1.filterTweetsWithURL(allTweets));
            var newNumberOfTweets = numberOfTweetsWithLinks - accTweets.length;
            console.log(newNumberOfTweets); // TODO: COMMENT THIS, ONLY FOR DEBUG.
            if (newNumberOfTweets > 0) {
                var newCurrentMaxId = utils_1.getLastTweetId(accTweets);
                getTuitsWithLinks(userData, newNumberOfTweets, onTuitsWithLinksGetted, newCurrentMaxId);
            }
            var strAllTuits = JSON.stringify(accTweets, null, 2);
            fs_1.writeFileSync('tuits.json', strAllTuits); // TODO: COMMENT THIS, ONLY FOR DEBUG.
            onTuitsWithLinksGetted();
        }
    });
};
var prepareTwitterResquestParams = function (currentMaxId) { return (currentMaxId ? {
    count: tweetsByResquest,
    max_id: currentMaxId,
} :
    {
        count: tweetsByResquest,
    }); };
