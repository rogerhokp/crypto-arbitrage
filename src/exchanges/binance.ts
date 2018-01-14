///<reference path="./binance.d.ts"/>
import { default as Exchanges, Price, Pair } from './exchanges';
import * as binance from 'binance';
import { retry } from 'async';

export default class Binance extends Exchanges {
    public name: string = 'Binance';
    private ws: any;
    private rest: any;
    private trade: any;
    private lastTicker: any = {};

    constructor() {
        super();
        this.ws = new binance.BinanceWS({});
        this.rest = new binance.BinanceRest({
            key: 'api-key',
            secret: 'api-secret',
            timeout: 15000,
            recvWindow: 10000,
            disableBeautification: false
        });
    }

    init(): Promise<any> {
        return new Promise((resolve, reject) => {
            const ticker = this.ws.onAllTickers((data: any[]) => {//TODO change to trades
                if (data !== undefined) {
                    this.trade = ticker;
                    data.forEach(d => {
                        this.lastTicker[d.symbol] = d;
                    });
                    resolve();
                }
            })
        });
    }


    getSupportedAssets(baseAsset?: string): Promise<Pair[]> {

        return new Promise((resolve, reject) => {
            this.rest.exchangeInfo((err: Error, data: any) => {
                if (err) {
                    reject(err);
                    return;
                }

                let symbols = data.symbols;

                if (baseAsset !== undefined) {
                    const ba = baseAsset.toUpperCase();
                    symbols = symbols
                        .filter((s: any) => (s.baseAsset === ba || s.quoteAsset === ba));
                }

                resolve(
                    symbols.map((s: any) => ({ baseAsset: s.baseAsset, quoteAsset: s.quoteAsset }))
                );

            });
        });
    }


    getPrice(baseAsset: string, quoteAsset: string): Promise<Price> {
        const symbol = `${baseAsset.toUpperCase()}${quoteAsset.toUpperCase()}`;

        return new Promise((resolve, reject) => {


            retry({
                times: 99,
                interval: 1000,
            }, async (cb: Function) => {

                const tick = this.lastTicker[symbol];

                if (tick !== undefined) {
                    return {
                        baseAsset: baseAsset,
                        quoteAsset: quoteAsset,
                        buyPrice: tick.bestAskPrice,
                        sellPrice: tick.bestBid
                    };
                } else {
                    throw new Error('not found');
                }
            }, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });


        });


    }

}