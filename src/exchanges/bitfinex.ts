import { default as Exchanges, Price, Pair } from './exchanges';
import * as BFX from 'bitfinex-api-node';
import { retry } from 'async';

export default class Bitfinex extends Exchanges {

    public name: string = 'Bitfinex';
    private bfx: any;
    private tricker: any;
    private lastTicker: any = {};
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
                        ws.subscribeTicker(`${s.toUpperCase()}`);
                    });
                });

                ws.on('ticker', (pair: string, data: any) => {
                    this.lastTicker[pair] = data;
                });

                ws.on('error', console.error);
                ws.once('ticker', () => {
                    this.tricker = ws;
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

                const tick = this.lastTicker[symbol];
                if (tick !== undefined) {
                    return {
                        baseAsset: baseAsset,
                        quoteAsset: quoteAsset,
                        buyPrice: tick.ask,
                        sellPrice: tick.bid
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