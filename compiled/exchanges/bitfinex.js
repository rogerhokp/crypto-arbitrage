"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exchanges_1 = require("./exchanges");
const BFX = require("bitfinex-api-node");
const async_1 = require("async");
const _ = require("lodash");
class Bitfinex extends exchanges_1.default {
    constructor() {
        super();
        this.name = 'Bitfinex';
        this.lastTrades = {};
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
                        ws.subscribeTrades(`${s.toUpperCase()}`);
                    });
                });
                ws.on('trade', (pair, data) => {
                    if (_.isArray(data)) {
                        this.lastTrades[pair] = data[0];
                    }
                    else {
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
    getPrice(baseAsset, quoteAsset) {
        const symbol = `${baseAsset.toUpperCase()}${quoteAsset.toUpperCase()}`;
        return new Promise((resolve, reject) => {
            async_1.retry({
                times: 99,
                interval: 1000,
            }, async (cb) => {
                const trade = this.lastTrades[symbol];
                if (trade !== undefined) {
                    return {
                        baseAsset: baseAsset,
                        quoteAsset: quoteAsset,
                        buyPrice: trade.price,
                        sellPrice: trade.price
                    };
                }
                else {
                    throw new Error(symbol + ' not found');
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