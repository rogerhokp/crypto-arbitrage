import { default as Exchanges, Price, Pair } from './exchanges';
import * as binance from 'binance';

export default class Binance extends Exchanges {

    private ws: any;
    private rest: any;
    private trickers: any = {};
    private symbolLastTick: any = {};

    constructor() {
        super();
        this.ws = new binance.BinanceWS({});
        this.rest = new binance.BinanceRest({
            key: 'api-key', // Get this from your account on binance.com
            secret: 'api-secret', // Same for this
            timeout: 15000, // Optional, defaults to 15000, is the request time out in milliseconds
            recvWindow: 10000, // Optional, defaults to 5000, increase if you're getting timestamp errors
            disableBeautification: false
            /*
             * Optional, default is false. Binance's API returns objects with lots of one letter keys.  By
             * default those keys will be replaced with more descriptive, longer ones.
             */
        });
    }

    getAssetList(baseAsset: string): Promise<Pair[]> {
        const ba = baseAsset.toUpperCase();
        return new Promise((resolve, reject) => {
            this.rest.exchangeInfo((err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data.symbols
                    .filter((s: any) => (s.baseAsset === ba || s.quoteAsset === ba))
                    .map((s: any) => ({ baseAssets: s.baseAsset, quoteAsset: s.quoteAsset }))
                );
            });
        });
    }

    private initTricker(symbol: string, cb: Function) {

        this.trickers[symbol] = this.ws.onTicker(symbol, (data: any) => {
            if (data !== undefined) {
                this.symbolLastTick[symbol] = data;

                cb();
            }

        })
    }

    getAskPrice(sell: string, buy: string): Promise<Price> {
        const symbol = `${sell.toUpperCase()}${buy.toUpperCase()}`;
        const resovled = (resvole: Function) => {
            const tick = this.symbolLastTick[symbol];

            resvole({
                priceInCrypto: tick.bestAskPrice,
                priceInUsd: 0//TODO
            });

        }
        return new Promise((resvole, reject) => {

            if (this.trickers[symbol] === undefined) {
                this.initTricker(symbol, () => {
                    resovled(resvole);
                })
            } else {
                resovled(resvole)
            }

        });


    }
    getBidPrice(buy: string, sell: string): Promise<Price> {
        const symbol = `${sell.toUpperCase()}${buy.toUpperCase()}`;
        const resovled = (resvole: Function) => {
            const tick = this.symbolLastTick[symbol];
            resvole({
                priceInCrypto: tick.bestBid,
                priceInUsd: 0//TODO
            });

        }
        return new Promise((resvole, reject) => {

            if (this.trickers[symbol] === undefined) {
                this.initTricker(symbol, () => {
                    resovled(resvole);
                })
            } else {
                resovled(resvole)
            }

        });
    }

}