///<reference path="./cexio.d.ts" />
import { default as Exchanges, Price, Pair } from './exchanges';
import * as CEXIO from 'cexio-api-node';
import { retry } from 'async';
import { resolve } from 'url';

export default class Cexio extends Exchanges {

    public name: string = 'CexIO';
    private tricker: any;
    private lastTicker: any = {};
    private allSymbols: string[];

    constructor() {
        super();

    }


    getSupportedAssets(baseAsset?: string): Promise<Pair[]> {
        const ba = baseAsset.toUpperCase();


        return new Promise((resolve, reject) => {


            new CEXIO().rest.currency_limits((err: Error, data: any) => {
                if (err) {
                    throw err;
                }

                resolve(data.pairs
                    .map((p: any) => ({
                        baseAsset: p.symbol1.toUpperCase(),
                        quoteAsset: p.symbol2.toUpperCase()
                    }))
                    .filter((p: Pair) => {
                        if (baseAsset === undefined) {
                            return true;
                        }
                        return p.baseAsset === ba || p.quoteAsset === ba;
                    })
                );
            })


        });
    }


    init(): Promise<any> {
        return Promise.resolve();
        // return new Promise((resolve, reject) => {


        //     const ws = new CEXIO('', '').ws;

        //     ws.on('open', () => {
        //         ws.subscribeTicker();
        //     });

        //     ws.on('ticker', (resp: any) => {
        //         const symbol = resp.data.pair.replace(':', '');
        //         this.lastTicker[symbol] = resp.data;
        //     });

        //     ws.on('error', console.error);
        //     ws.once('ticker', () => {
        //         resolve();
        //     });
        //     ws.open();

        // });

    }


    _restGetTicker(symbol: string): Promise<any> {
        return new Promise((resolve, reject) => {

            const ticker = new CEXIO().rest.ticker(symbol, (err: Error, data: any) => {
                if (!err && data !== undefined && data !== null) {
                    resolve(data);
                } else {
                    reject('Symobl not found');
                }
            });
        });
    }
    getPrice(baseAsset: string, quoteAsset: string): Promise<Price> {

        return new Promise((resolve, reject) => {

            retry({
                times: 5,
                interval: 1000,
            }, async () => {
                try {
                    const ticker = await this._restGetTicker(`${baseAsset.toUpperCase()}/${quoteAsset.toUpperCase()}`);

                    return {
                        baseAsset: baseAsset,
                        quoteAsset: quoteAsset,
                        buyPrice: ticker.ask,
                        sellPrice: ticker.bid
                    };
                } catch (e) {

                    try {
                        const ticker = await this._restGetTicker(`${quoteAsset.toUpperCase()}/${baseAsset.toUpperCase()}`);
                        return {
                            baseAsset: quoteAsset,
                            quoteAsset: baseAsset,
                            buyPrice: ticker.bid,
                            sellPrice: ticker.ask
                        };
                    } catch (e) {

                        throw e;
                    }

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