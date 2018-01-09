export default abstract class Exchanges {


    abstract getAskPrice(sell: string, buy: string): Promise<Price>

    abstract getBidPrice(sell: string, buy: string): Promise<Price>

    abstract getAssetList(baseAsset: string): Promise<Pair[]>
}

export interface Price {
    priceInCrypto: number;
    priceInUsd: number;

}

export interface Pair {
    baseAsset: string;
    quoteAsset: string;

}