"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var twitter_1 = __importDefault(require("twitter"));
var fs_1 = require("fs");
var utils_1 = require("./utils");
var networksPath = 'build/networks.json';
var tweetsForResquest = 50;
var accTweets = [];
fs_1.readFile(networksPath, function (err, data) {
    if (err)
        throw err;
    var userData = JSON.parse(data);
    accTweets = [];
    mainTwitter(userData, 151);
});
var mainTwitter = function (userData, numberOfTweetsWithLinks, currentMaxId) {
    var client = new twitter_1.default(userData);
    var params = prepareTwitterResquestParams(currentMaxId);
    client.get('statuses/home_timeline', params, function (error, tweets, response) {
        if (!error) {
            var allTweets = utils_1.extractMessagesFromTweets(tweets);
            accTweets = accTweets.concat(utils_1.filterTweetsWithURL(allTweets));
            var newNumberOfTweets = numberOfTweetsWithLinks - accTweets.length;
            console.log(newNumberOfTweets); // BORRAR LUEGO.
            if (newNumberOfTweets > 0) {
                var newCurrentMaxId = utils_1.getLastTweetId(accTweets);
                mainTwitter(userData, newNumberOfTweets, newCurrentMaxId);
            }
            var strAllTuits = JSON.stringify(accTweets, null, 2);
            fs_1.writeFileSync('tuits.json', strAllTuits);
        }
    });
};
var prepareTwitterResquestParams = function (currentMaxId) { return (currentMaxId ? {
    count: tweetsForResquest,
    max_id: currentMaxId,
} :
    {
        count: tweetsForResquest,
    }); };
