export interface TwitterData {
    consumer_key: string;
    consumer_secret: string;
    access_token_key: string;
    access_token_secret: string;
}

export const extractTwitterData = (data: any): TwitterData => ({
    consumer_key: data.consumer_key,
    consumer_secret: data.consumer_secret,
    access_token_key: data.access_token_key,
    access_token_secret: data.access_token_secret,
});