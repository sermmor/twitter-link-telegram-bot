"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var isTweetWithMedia = function (tweet) { return tweet.entities && tweet.entities.media; };
var isTweetsWithURL = function (tweet) { return tweet.full_text.includes('https://') || tweet.full_text.includes('http://'); };
var isTweetWithNotQuoteStatus = function (tweet) { return !tweet.is_quote_status; };
var isTweetTruncated = function (tweet) { return tweet.truncated; };
var isAUrlTweetValid = function (tw) {
    return isTweetsWithURL(tw);
}; //&& isTweetWithNotQuoteStatus(tw) && !isTweetWithMedia(tw) && !isTweetTruncated(tw)
exports.extractMessagesFromTweets = function (tweets) {
    var messages = [];
    tweets.forEach(function (tw) {
        if (isAUrlTweetValid(tw))
            messages.push({
                username: tw.user.name,
                handle: "@" + tw.user.screen_name,
                message: tw.full_text,
                id: tw.id_str,
            });
    });
    return messages;
};
exports.getLastTweetId = function (tweets) {
    return tweets.length > 0 ? tweets[tweets.length - 1].id_str : undefined;
};
