// See example of tweet in https://developer.twitter.com/en/docs/tweets/timelines/api-reference/get-statuses-home_timeline
interface TwitterMessageData {
    created_at: string;
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

export interface ResquestParams {
    count: number,
    exclude_replies: boolean,
    tweet_mode: string,
    max_id?: string,
    list_id?: string,
}

export interface MessageData {
    username: string;
    handle: string;
    message: string;
    truncated: boolean;
    is_quote_status: boolean;
    hasMedia: boolean;
    id: string;
    createdAt: string;
}

export const extractMessagesFromTweets = (tweets: TwitterMessageData[]): MessageData[] => {
    return tweets.map((tw: TwitterMessageData): MessageData => ({
        username: tw.user.name,
        handle: `@${tw.user.screen_name}`,
        message: tw.full_text,
        id: tw.id_str,
        truncated: tw.truncated,
        is_quote_status: tw.is_quote_status,
        hasMedia: tw.entities && tw.entities.media,
        createdAt: tw.created_at,
    }));
};

export const getLastTweetId = (tweets: TwitterMessageData[]): string | undefined => 
    tweets.length > 0 ? tweets[tweets.length - 1].id_str : undefined;

const isTweetWithMedia = (tweet: MessageData) => tweet.hasMedia;
const isTweetsWithURL = (tweet: MessageData) => tweet.message.includes('https://') || tweet.message.includes('http://');
const isTweetWithNotQuoteStatus = (tweet: MessageData) => !tweet.is_quote_status;
const isTweetTruncated = (tweet: MessageData) => tweet.truncated;

const isAUrlTweetValid = (tw: MessageData): boolean =>
    isTweetsWithURL(tw) && isTweetWithNotQuoteStatus(tw) && !isTweetWithMedia(tw) //&& !isTweetTruncated(tw)

export const filterTweets = (messages: MessageData[]): MessageData[] => (
    messages.filter(isAUrlTweetValid)
)