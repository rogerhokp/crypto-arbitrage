"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exchanges_1 = require("./exchanges");
const binance = require("binance");
const async_1 = require("async");
class Binance extends exchanges_1.default {
    constructor() {
        super();
        this.name = 'Binance';
        this.lastTicker = {};
        this.ws = new binance.BinanceWS({});
        this.rest = new binance.BinanceRest({
            key: 'api-key',
            secret: 'api-secret',
            timeout: 15000,
            recvWindow: 10000,
            disableBeautification: false
        });
    }
    init() {
        return new Promise((resolve, reject) => {
            const ticker = this.ws.onAllTickers((data) => {
                if (data !== undefined) {
                    this.ticker = ticker;
                    data.forEach(d => {
                        this.lastTicker[d.symbol] = d;
                    });
                    resolve();
                }
            });
        });
    }
    getSupportedAssets(baseAsset) {
        return new Promise((resolve, reject) => {
            this.rest.exchangeInfo((err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                let symbols = data.symbols;
                if (baseAsset !== undefined) {
                    const ba = baseAsset.toUpperCase();
                    symbols = symbols
                        .filter((s) => (s.baseAsset === ba || s.quoteAsset === ba));
                }
                resolve(symbols.map((s) => ({ baseAsset: s.baseAsset, quoteAsset: s.quoteAsset })));
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
                        buyPrice: tick.bestAskPrice,
                        sellPrice: tick.bestBid
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
exports.default = Binance;
//# sourceMappingURL=binance.js.map