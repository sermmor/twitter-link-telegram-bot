import Twitter from 'twitter';
import { readFile, writeFileSync } from 'fs';
import { extractMessagesFromTweets, MessageData, filterTweetsWithURL, getLastTweetId } from './utils';

const networksPath = 'build/networks.json';
const tweetsByResquest = 50;

let accTweets: MessageData[] = [];

readFile(networksPath, (err, data) => {
    if (err) throw err;

    let userData = JSON.parse(<string> <any> data);

    accTweets = [];
    mainTwitter(userData, 151);
});

const mainTwitter = (
    userData: TwitterData,
    numberOfTweetsWithLinks: number,
    currentMaxId?: string
) => {
    const client = new Twitter(userData);

    const params: Twitter.RequestParams = prepareTwitterResquestParams(currentMaxId);
    client.get('statuses/home_timeline', params, function(error, tweets, response) {
        if (!error) {
            const allTweets: MessageData[] = extractMessagesFromTweets(<any> tweets);
            accTweets = accTweets.concat(filterTweetsWithURL(allTweets));
            const newNumberOfTweets = numberOfTweetsWithLinks - accTweets.length;

            if (newNumberOfTweets > 0) {
                const newCurrentMaxId = getLastTweetId(accTweets);
                mainTwitter(userData, newNumberOfTweets, newCurrentMaxId);
            }

            const strAllTuits: string = JSON.stringify(accTweets, null, 2);
            writeFileSync('tuits.json', strAllTuits);
        }
    });
};

const prepareTwitterResquestParams = (currentMaxId?: string) => (
    currentMaxId ? {
        count: tweetsByResquest,
        max_id: currentMaxId,
    } : 
    {
        count: tweetsByResquest,
    }
);