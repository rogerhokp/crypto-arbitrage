"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exchanges_1 = require("./exchanges");
const BFX = require("bitfinex-api-node");
const async_1 = require("async");
class Bitfinex extends exchanges_1.default {
    constructor() {
        super();
        this.name = 'Bitfinex';
        this.lastTicker = {};
        this.bfx = new BFX({
            ws: {
                autoReconnect: true,
                seqAudit: true,
                packetWDDelay: 10 * 1000
            }
        });
    }
    getSupportedAssets(baseAsset) {
        const ba = baseAsset.toUpperCase();
        return new Promise((resolve, reject) => {
            resolve(this.allSymbols
                .map((s) => ({
                baseAsset: s.substr(0, 3).toUpperCase(),
                quoteAsset: s.substr(3).toUpperCase()
            }))
                .filter((p) => {
                if (baseAsset === undefined) {
                    return true;
                }
                return p.baseAsset === ba || p.quoteAsset === ba;
            }));
        });
    }
    _getAllSymbols(cb) {
        this.bfx.rest(2).symbols((err, symbols) => {
            if (err) {
                throw err;
            }
            cb(symbols);
        });
    }
    init() {
        return new Promise((resolve, reject) => {
            this._getAllSymbols((allSymbols) => {
                this.allSymbols = allSymbols;
                const ws = this.bfx.ws(1);
                ws.on('open', () => {
                    allSymbols.forEach(s => {
                        ws.subscribeTicker(`${s.toUpperCase()}`);
                    });
                });
                ws.on('ticker', (pair, data) => {
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
    getPrice(baseAsset, quoteAsset) {
        const symbol = `${baseAsset.toUpperCase()}${quoteAsset.toUpperCase()}`;
        return new Promise((resolve, reject) => {
            async_1.retry({
                times: 99,
                interval: 1000,
            }, async (cb) => {
                const tick = this.lastTicker[symbol];
                if (tick !== undefined) {
                    return {
                        baseAsset: baseAsset,
                        quoteAsset: quoteAsset,
                        buyPrice: tick.ask,
                        sellPrice: tick.bid
                    };
                }
                else {
                    throw new Error('not found');
                }
            }, (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    }
}
exports.default = Bitfinex;
//# sourceMappingURL=bitfinex.js.map