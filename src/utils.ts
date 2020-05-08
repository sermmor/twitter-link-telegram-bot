interface TwitterMessageData {
    text: string;
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
}

export const extractMessagesFromTuits = (tweets: TwitterMessageData[]): MessageData[] => {
    const messages: MessageData[] = [];
    tweets.forEach(tw => {
        messages.push({
            username: tw.user.name,
            handle: `@${tw.user.screen_name}`,
            message: tw.text,
        });
    });
    return messages;
}