// See example of tweet in https://developer.twitter.com/en/docs/tweets/timelines/api-reference/get-statuses-home_timeline
interface TwitterMessageData {
    text: string;
    id_str: string,
    is_quote_status: boolean;
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
    isQuoteStatus: boolean;
    id: string;
}

export const extractMessagesFromTweets = (tweets: TwitterMessageData[]): MessageData[] => {
    const messages: MessageData[] = [];
    tweets.forEach(tw => {
        messages.push({
            username: tw.user.name,
            handle: `@${tw.user.screen_name}`,
            message: tw.text,
            id: tw.id_str,
            isQuoteStatus: tw.is_quote_status,
        });
    });
    return messages;
};

export const filterNotQuoteStatus = (tweets: MessageData[]) => 
    tweets.filter(msg => !msg.isQuoteStatus);

export const filterTweetsWithURL = (tweets: MessageData[]) => 
    filterNotQuoteStatus(tweets)
        .filter(msg => msg.message.includes('https://') || msg.message.includes('http://'));
        // tweets.filter(msg => msg.message.includes('https://') || msg.message.includes('http://'));

export const getLastTweetId = (tweets: MessageData[]): string | undefined => 
    tweets.length > 0 ? tweets[tweets.length - 1].id : undefined;
