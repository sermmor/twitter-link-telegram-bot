# twitter-link-telegram-bot
Telegram bot in NodeJS for get n number of links of a twitter profile TL.

# Configuration
In root folder, create a video folder and put two videos: finished.mp4 and start.mp4.

In root folder, create a file `networks.json` and put the following content for your data:
```json
{
    "consumer_key": "",
    "consumer_secret": "",
    "access_token_key": "",
    "access_token_secret": "",
    "telegram_bot_token": "",
    "bot_tuit_command": "",
    "user_lists": [
        {
            "list_id": "",
            "bot_list_command": ""
        },
        {
            "list_id": "",
            "bot_list_command": ""
        },
        ...
        {
            "list_id": "",
            "bot_list_command": ""
        },
    ]
}
```

For list ID you can see the [twitter documentation about list](https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/get-lists-statuses).


So, the final folder structure will be the following:

![finalPathScript](https://raw.githubusercontent.com/sermmor/twitter-link-telegram-bot/master/images/finalPathScript.png)
