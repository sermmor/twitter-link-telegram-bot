export interface TelegramData {
    telegram_bot_token: string;
    bot_tuit_command: string;
    user_lists: {
        list_id: string,
        bot_list_command: string
    }[];
}

export const extractTelegramData = (data: any): TelegramData => ({
    telegram_bot_token: data.telegram_bot_token,
    bot_tuit_command: data.bot_tuit_command,
    user_lists:[
        ...data.user_lists.map((value: any) => ({
            list_id: value.list_id,
            bot_list_command: value.bot_list_command,
        })),
    ]
});
