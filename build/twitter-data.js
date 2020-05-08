"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTwitterData = function (data) { return ({
    consumer_key: data.consumer_key,
    consumer_secret: data.consumer_secret,
    access_token_key: data.access_token_key,
    access_token_secret: data.access_token_secret,
}); };
