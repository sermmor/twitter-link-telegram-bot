import Twitter from 'twitter';
import { readFile, writeFileSync } from 'fs';
import { extractMessagesFromTweets, MessageData, filterTweetsWithURL, getLastTweetId } from './utils';
import { extractTwitterData, TwitterData } from './twitter-data';

const networksPath = 'build/networks.json';
const tweetsByResquest = 50;

let accTweets: MessageData[] = [];

readFile(networksPath, (err, data) => {
    if (err) throw err;

    const telegramNumberOfTweetsWithLinks = 10;

    const userData = JSON.parse(<string> <any> data);
    const userTwitterData = extractTwitterData(userData);

    accTweets = [];
    getTuitsWithLinks(userTwitterData, telegramNumberOfTweetsWithLinks, () => {
        // TODO: Send tweets to Telegram.
    });
});

const getTuitsWithLinks = (
    userData: TwitterData,
    numberOfTweetsWithLinks: number,
    onTuitsWithLinksGetted: (() => void),
    currentMaxId?: string
) => {
    const client = new Twitter(userData);
    const params: Twitter.RequestParams = prepareTwitterResquestParams(currentMaxId);

    client.get('statuses/home_timeline', params, function(error, tweets, response) {
        if (!error) {
            const allTweets: MessageData[] = extractMessagesFromTweets(<any> tweets);
            accTweets = accTweets.concat(filterTweetsWithURL(allTweets));
            const newNumberOfTweets = numberOfTweetsWithLinks - accTweets.length;

            console.log(newNumberOfTweets); // TODO: COMMENT THIS, ONLY FOR DEBUG.
            if (newNumberOfTweets > 0) {
                const newCurrentMaxId = getLastTweetId(accTweets);
                getTuitsWithLinks(userData, newNumberOfTweets, onTuitsWithLinksGetted, newCurrentMaxId);
            }

            const strAllTuits: string = JSON.stringify(accTweets, null, 2);
            writeFileSync('tuits.json', strAllTuits); // TODO: COMMENT THIS, ONLY FOR DEBUG.
            onTuitsWithLinksGetted();
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