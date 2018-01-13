export default abstract class Exchanges {

    abstract init(): Promise<any>
    abstract getPrice(sell: string, buy: string): Promise<Price>
    abstract getSupportedAssets(baseAsset?: string): Promise<Pair[]>
}

export interface Price {
    baseAsset: string;
    quoteAsset: string;
    buyPrice: number;
    sellPrice: number;
}

export interface Pair {
    baseAsset: string;
    quoteAsset: string;

}