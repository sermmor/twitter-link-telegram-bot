import Twitter from 'twitter';
import { readFile, writeFileSync } from 'fs';
import { extractMessagesFromTuits, MessageData } from './utils';

const networksPath = 'build/networks.json';

readFile(networksPath, (err, data) => {
    if (err) throw err;

    let userData = JSON.parse(<string> <any> data);

    mainTwitter(userData);
});

const mainTwitter = (userData: TwitterData) => {
    const client = new Twitter(userData);

    const params: Twitter.RequestParams = {screen_name: 'nodejs'};
    client.get('statuses/user_timeline', params, function(error, tweets, response) {
        if (!error) {
            const allTweets: MessageData[] = extractMessagesFromTuits(<any> tweets);
            const strAllTuits: string = JSON.stringify(allTweets, null, 2);
            writeFileSync('tuits.json', strAllTuits);
        }
    });
}