"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTelegramData = function (data) { return ({
    telegram_bot_token: data.telegram_bot_token,
    bot_tuit_command: data.bot_tuit_command,
}); };
