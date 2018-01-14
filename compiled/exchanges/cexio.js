"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exchanges_1 = require("./exchanges");
const CEXIO = require("cexio-api-node");
const async_1 = require("async");
class Cexio extends exchanges_1.default {
    constructor() {
        super();
        this.name = 'CexIO';
        this.lastTicker = {};
    }
    getSupportedAssets(baseAsset) {
        const ba = baseAsset.toUpperCase();
        return new Promise((resolve, reject) => {
            new CEXIO().rest.currency_limits((err, data) => {
                if (err) {
                    throw err;
                }
                resolve(data.pairs
                    .map((p) => ({
                    baseAsset: p.symbol1.toUpperCase(),
                    quoteAsset: p.symbol2.toUpperCase()
                }))
                    .filter((p) => {
                    if (baseAsset === undefined) {
                        return true;
                    }
                    return p.baseAsset === ba || p.quoteAsset === ba;
                }));
            });
        });
    }
    init() {
        return Promise.resolve();
    }
    _restGetTicker(symbol) {
        return new Promise((resolve, reject) => {
            const ticker = new CEXIO().rest.ticker(symbol, (err, data) => {
                if (!err && data !== undefined && data !== null) {
                    resolve(data);
                }
                else {
                    reject('Symobl not found');
                }
            });
        });
    }
    getPrice(baseAsset, quoteAsset) {
        return new Promise((resolve, reject) => {
            async_1.retry({
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
                }
                catch (e) {
                    try {
                        const ticker = await this._restGetTicker(`${quoteAsset.toUpperCase()}/${baseAsset.toUpperCase()}`);
                        return {
                            baseAsset: quoteAsset,
                            quoteAsset: baseAsset,
                            buyPrice: ticker.bid,
                            sellPrice: ticker.ask
                        };
                    }
                    catch (e) {
                        throw e;
                    }
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
exports.default = Cexio;
//# sourceMappingURL=cexio.js.map