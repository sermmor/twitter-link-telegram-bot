"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var twitter_1 = __importDefault(require("twitter"));
var fs_1 = require("fs");
var utils_1 = require("./utils");
var networksPath = 'build/networks.json';
fs_1.readFile(networksPath, function (err, data) {
    if (err)
        throw err;
    var userData = JSON.parse(data);
    mainTwitter(userData);
});
var mainTwitter = function (userData) {
    var client = new twitter_1.default(userData);
    var params = { screen_name: 'nodejs' };
    client.get('statuses/user_timeline', params, function (error, tweets, response) {
        if (!error) {
            var allTweets = utils_1.extractMessagesFromTuits(tweets);
            var strAllTuits = JSON.stringify(allTweets, null, 2);
            fs_1.writeFileSync('tuits.json', strAllTuits);
        }
    });
};
