///<reference path="./bitfinex.d.ts" />
import { default as Exchanges, Price, Pair } from './exchanges';
import * as BFX from 'bitfinex-api-node';
import { retry } from 'async';
import * as _ from 'lodash';

export default class Bitfinex extends Exchanges {

    public name: string = 'Bitfinex';
    private bfx: any;
    private trades: any;
    private lastTrades: any = {};
    private allSymbols: string[];

    constructor() {
        super();
        this.bfx = new BFX({
            // apiKey: '...',
            // apiSecret: '...',

            ws: {
                autoReconnect: true,
                seqAudit: true,
                packetWDDelay: 10 * 1000
            }
        })


    }


    getSupportedAssets(baseAsset?: string): Promise<Pair[]> {
        const ba = baseAsset.toUpperCase();
        return new Promise((resolve, reject) => {
            resolve(this.allSymbols
                .map((s: string) => ({
                    baseAsset: s.substr(0, 3).toUpperCase(),
                    quoteAsset: s.substr(3).toUpperCase()
                }))
                .filter((p: Pair) => {
                    if (baseAsset === undefined) {
                        return true;
                    }
                    return p.baseAsset === ba || p.quoteAsset === ba;
                })
            );
        });
    }

    _getAllSymbols(cb: Function) {
        this.bfx.rest(2).symbols((err: Error, symbols: any) => {
            if (err) {
                throw err;
            }
            cb(symbols);
        })
    }

    init(): Promise<any> {
        return new Promise((resolve, reject) => {
            this._getAllSymbols((allSymbols: string[]) => {
                this.allSymbols = allSymbols;
                const ws = this.bfx.ws(1);

                ws.on('open', () => {
                    allSymbols.forEach(s => {
                        ws.subscribeTrades(`${s.toUpperCase()}`);
                    });
                });


                ws.on('trade', (pair: string, data: any) => {
                    if (_.isArray(data)) {
                        this.lastTrades[pair] = data[0];
                    } else {
                        this.lastTrades[pair] = data;
                    }

                });

                ws.on('error', console.error);
                ws.once('trade', () => {
                    this.trades = ws;
                    resolve();
                });
                ws.open();
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

                const trade = this.lastTrades[symbol];
                if (trade !== undefined) {
                    return {
                        baseAsset: baseAsset,
                        quoteAsset: quoteAsset,
                        buyPrice: trade.price,
                        sellPrice: trade.price
                    };
                } else {
                    throw new Error(symbol + ' not found');
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