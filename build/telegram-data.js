"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTelegramData = function (data) { return ({
    telegram_bot_token: data.telegram_bot_token,
    bot_tuit_command: data.bot_tuit_command,
    user_lists: __spreadArrays(data.user_lists.map(function (value) { return ({
        list_id: value.list_id,
        bot_list_command: value.bot_list_command,
    }); }))
}); };
