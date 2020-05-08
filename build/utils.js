"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMessagesFromTweets = function (tweets) {
    var messages = [];
    tweets.forEach(function (tw) {
        messages.push({
            username: tw.user.name,
            handle: "@" + tw.user.screen_name,
            message: tw.text,
            id: tw.id_str,
            isQuoteStatus: tw.is_quote_status,
        });
    });
    return messages;
};
exports.filterNotQuoteStatus = function (tweets) {
    return tweets.filter(function (msg) { return !msg.isQuoteStatus; });
};
exports.filterTweetsWithURL = function (tweets) {
    return exports.filterNotQuoteStatus(tweets)
        .filter(function (msg) { return msg.message.includes('https://') || msg.message.includes('http://'); });
};
// tweets.filter(msg => msg.message.includes('https://') || msg.message.includes('http://'));
exports.getLastTweetId = function (tweets) {
    return tweets.length > 0 ? tweets[tweets.length - 1].id : undefined;
};
