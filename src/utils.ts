// See example of tweet in https://developer.twitter.com/en/docs/tweets/timelines/api-reference/get-statuses-home_timeline
interface TwitterMessageData {
    full_text: string;
    id_str: string,
    is_quote_status: boolean;
    truncated: boolean;
    user: {
        name: string;
        screen_name: string;
        [key: string]: any;
    }
    [key: string]: any;
}

export interface MessageData {
    username: string;
    handle: string;
    message: string;
    id: string;
}

const isTweetWithMedia = (tweet: TwitterMessageData) => tweet.entities && tweet.entities.media;
const isTweetsWithURL = (tweet: TwitterMessageData) => tweet.full_text.includes('https://') || tweet.full_text.includes('http://');
const isTweetWithNotQuoteStatus = (tweet: TwitterMessageData) => !tweet.is_quote_status;
const isTweetTruncated = (tweet: TwitterMessageData) => tweet.truncated;

const isAUrlTweetValid = (tw: TwitterMessageData) =>
    isTweetsWithURL(tw) //&& isTweetWithNotQuoteStatus(tw) && !isTweetWithMedia(tw) && !isTweetTruncated(tw)

export const extractMessagesFromTweets = (tweets: TwitterMessageData[]): MessageData[] => {
    const messages: MessageData[] = [];
    tweets.forEach(tw => {
        if (isAUrlTweetValid(tw))
            messages.push({
                username: tw.user.name,
                handle: `@${tw.user.screen_name}`,
                message: tw.full_text,
                id: tw.id_str,
            });
    });
    return messages;
};

export const getLastTweetId = (tweets: TwitterMessageData[]): string | undefined => 
    tweets.length > 0 ? tweets[tweets.length - 1].id_str : undefined;
