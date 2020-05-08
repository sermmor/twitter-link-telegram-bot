"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMessagesFromTweets = function (tweets) {
    return tweets.map(function (tw) { return ({
        username: tw.user.name,
        handle: "@" + tw.user.screen_name,
        message: tw.full_text,
        id: tw.id_str,
        truncated: tw.truncated,
        is_quote_status: tw.is_quote_status,
        hasMedia: tw.entities && tw.entities.media,
    }); });
};
exports.getLastTweetId = function (tweets) {
    return tweets.length > 0 ? tweets[tweets.length - 1].id_str : undefined;
};
var isTweetWithMedia = function (tweet) { return tweet.hasMedia; };
var isTweetsWithURL = function (tweet) { return tweet.message.includes('https://') || tweet.message.includes('http://'); };
var isTweetWithNotQuoteStatus = function (tweet) { return !tweet.is_quote_status; };
var isTweetTruncated = function (tweet) { return tweet.truncated; };
var isAUrlTweetValid = function (tw) {
    return isTweetsWithURL(tw) && isTweetWithNotQuoteStatus(tw) && !isTweetWithMedia(tw);
}; //&& !isTweetTruncated(tw)
exports.filterTweets = function (messages) { return (messages.filter(isAUrlTweetValid)); };
