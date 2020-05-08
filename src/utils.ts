interface TwitterMessageData {
    text: string;
    id_str: string,
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

export const extractMessagesFromTweets = (tweets: TwitterMessageData[]): MessageData[] => {
    const messages: MessageData[] = [];
    tweets.forEach(tw => {
        messages.push({
            username: tw.user.name,
            handle: `@${tw.user.screen_name}`,
            message: tw.text,
            id: tw.id_str,
        });
    });
    return messages;
};

export const filterTweetsWithURL = (tweets: MessageData[]) => 
    tweets.filter(msg => msg.message.includes('https://') || msg.message.includes('http://'));

export const getLastTweetId = (tweets: MessageData[]): string | undefined => 
    tweets.length > 0 ? tweets[tweets.length - 1].id : undefined;
