"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMessagesFromTuits = function (tweets) {
    var messages = [];
    tweets.forEach(function (tw) {
        messages.push({
            username: tw.user.name,
            handle: "@" + tw.user.screen_name,
            message: tw.text,
        });
    });
    return messages;
};
