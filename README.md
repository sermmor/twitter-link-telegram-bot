# Twitter Link To Telegram Bot
Telegram bot in NodeJS for get n number of links of a twitter profile timeline or twitter lists.

# Install
For install the bot, use the following console command:
```shell
$ npm install
```

# Configuration
In root folder, create a video folder and put two videos: finished.mp4 and start.mp4.

In root folder, create a file `networks.json` and put the following content for your data:
```javascript
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
        // ...
        {
            "list_id": "",
            "bot_list_command": ""
        },
    ]
}
```

About Twitter *consumer_key*, *consumer_secret*, *access_token_key*, and *access_token_secret*, these are 2 keys for  your Twitter Oauth Profile and other 2 keys your Twitter App. If you don't have one of this, you can create an Twitter App and get the keys in a few minutes following good tutorials [like this one](https://www.youtube.com/watch?v=LpLYQz_3hA0).

About Telegram *telegram_bot_token*, it is a token that you can have creating your Telegram bot app using the BotFather. You can see a tutorial about [create bot with BotFather in the official Telegram documentation](https://core.telegram.org/bots#6-botfather).

For list ID you can see the [twitter documentation about list](https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/get-lists-statuses).

About *bot_tuit_command* and *bot_list_command*, you can put the command that you want to send from Telegram client to your bot for getting the TL or list links.

So, the final folder structure will be the following:

![finalPathScript](https://raw.githubusercontent.com/sermmor/twitter-link-telegram-bot/master/images/finalPathScript.png)

# Start the bot
For start the bot, you have to to launch the following console command:
```shell
$ npm start
```

# Use the bot
For start the bot send `\start`.

For get links from tweets of a TL, you have to send `\[*bot_tuit_command*][number ending in 10]`. For instance if our *bot_tuit_command* is *"MyTLIsGreat"*, and you want 400 links with links (if there is less than 400, it sends all that Twitter API can) (400 is ends in 10, so, for instance, you can't 401 or 15), the command to send from client will be `\MyTLIsGreat400`.

For get links from tweets of a list, you have to send `\[*bot_list_command*][number ending in 10]`. For instance if our *bot_list_command* is *"TheGreatestLinksAgain"*, and you want 400 links with links (if there is less than 400, it sends all that Twitter API can) (400 is ends in 10, so, for instance, you can't 401 or 15), the command to send from client will be `\TheGreatestLinksAgain400`.
