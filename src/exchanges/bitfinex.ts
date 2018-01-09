import { default as Exchanges, Price, Pair } from './exchanges';
import * as BFX from 'bitfinex-api-node';

export default class Bitfinex extends Exchanges {

    private bfx: any;
    private trickers: any = {};
    private symbolLastTick: any = {};

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


    getAssetList(baseAsset: string): Promise<Pair[]> {
        const ba = baseAsset.toUpperCase();
        return new Promise((resolve, reject) => {
            this.bfx.rest(2).symbols((err: Error, symbols: any) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(symbols
                    .map((s: string) => ({
                        baseAsset: s.substr(0, 3).toUpperCase(),
                        quoteAsset: s.substr(3).toUpperCase()
                    }))
                    .filter((p: Pair) => {
                        return p.baseAsset === ba || p.quoteAsset === ba;
                    })
                );
            })
        });
    }

    private initTricker(symbol: string, cb: Function) {
        const ws = this.bfx.ws(2);

        ws.on('open', () => {
            ws.subscribeTicker('t' + symbol);

        });

        ws.on('message', (data: any[]) => {
            if (data.map !== undefined && data[1].map !== undefined) {
                this.symbolLastTick[symbol] = data[1];
                this.trickers[symbol] = ws;
                cb();
            }
        });
        ws.on('error', console.error);

        ws.open();

    }

    getAskPrice(sell: string, buy: string): Promise<Price> {
        const symbol = `${sell.toUpperCase()}${buy.toUpperCase()}`;
        const resovled = (resvole: Function) => {
            const tick = this.symbolLastTick[symbol];

            resvole({
                priceInCrypto: tick[0],
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
                priceInCrypto: tick[2],
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