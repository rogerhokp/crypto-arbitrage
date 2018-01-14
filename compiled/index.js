"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const binance_1 = require("./exchanges/binance");
const bitfinex_1 = require("./exchanges/bitfinex");
const _ = require("lodash");
const colors = require("colors");
require("console.table");
const timers_1 = require("timers");
const baseAsset = 'ETH';
const sourceEx = new binance_1.default();
const targetEx = new bitfinex_1.default();
let sourceExSupportedAssets;
let targetExSupportedAssets;
const init = async () => {
    await sourceEx.init();
    sourceExSupportedAssets = await sourceEx.getSupportedAssets(baseAsset);
    await targetEx.init();
    targetExSupportedAssets = await targetEx.getSupportedAssets(baseAsset);
};
const exec = (async () => {
    try {
        const sourceExPriceList = await Promise.all(sourceExSupportedAssets.map((asset) => sourceEx.getPrice(asset.baseAsset, asset.quoteAsset)));
        const targetExPriceList = await Promise.all(targetExSupportedAssets.map((asset) => targetEx.getPrice(asset.baseAsset, asset.quoteAsset)));
        const targetExPriceGroupByBaseAsset = _.groupBy(targetExPriceList, p => p.baseAsset);
        const targetExPriceGroupByQuoteAsset = _.groupBy(targetExPriceList, p => p.quoteAsset);
        const compareResult = [];
        sourceExPriceList.forEach(sourcePrice => {
            if (targetExPriceGroupByBaseAsset[sourcePrice.quoteAsset] !== undefined) {
                targetExPriceGroupByBaseAsset[sourcePrice.quoteAsset].forEach(targetPrice => {
                    if (sourcePrice.baseAsset === targetPrice.quoteAsset) {
                        compareResult.push({
                            sourceFrom: sourcePrice.baseAsset,
                            sourceTo: sourcePrice.quoteAsset,
                            sourcePrice: sourcePrice.buyPrice,
                            targetFrom: targetPrice.baseAsset,
                            targetTo: targetPrice.quoteAsset,
                            targetPrice: targetPrice.sellPrice,
                            markUpPct: (targetPrice.sellPrice - sourcePrice.buyPrice) / sourcePrice.buyPrice
                        });
                    }
                });
            }
            if (targetExPriceGroupByBaseAsset[sourcePrice.baseAsset] !== undefined) {
                targetExPriceGroupByBaseAsset[sourcePrice.baseAsset].forEach(targetPrice => {
                    if (sourcePrice.quoteAsset === targetPrice.quoteAsset) {
                        compareResult.push({
                            sourceFrom: sourcePrice.quoteAsset,
                            sourceTo: sourcePrice.baseAsset,
                            sourcePrice: sourcePrice.sellPrice,
                            targetFrom: targetPrice.baseAsset,
                            targetTo: targetPrice.quoteAsset,
                            targetPrice: targetPrice.sellPrice,
                            markUpPct: (targetPrice.sellPrice - sourcePrice.sellPrice) / sourcePrice.sellPrice
                        });
                    }
                });
            }
            if (targetExPriceGroupByQuoteAsset[sourcePrice.quoteAsset] !== undefined) {
                targetExPriceGroupByQuoteAsset[sourcePrice.quoteAsset].forEach(targetPrice => {
                    if (sourcePrice.baseAsset === targetPrice.baseAsset) {
                        compareResult.push({
                            sourceFrom: sourcePrice.baseAsset,
                            sourceTo: sourcePrice.quoteAsset,
                            sourcePrice: sourcePrice.buyPrice,
                            targetFrom: targetPrice.quoteAsset,
                            targetTo: targetPrice.baseAsset,
                            targetPrice: targetPrice.buyPrice,
                            markUpPct: (targetPrice.buyPrice - sourcePrice.buyPrice) / sourcePrice.buyPrice
                        });
                    }
                });
            }
            if (targetExPriceGroupByQuoteAsset[sourcePrice.baseAsset] !== undefined) {
                targetExPriceGroupByQuoteAsset[sourcePrice.baseAsset].forEach(targetPrice => {
                    if (sourcePrice.quoteAsset === targetPrice.baseAsset) {
                        compareResult.push({
                            sourceFrom: sourcePrice.quoteAsset,
                            sourceTo: sourcePrice.baseAsset,
                            sourcePrice: sourcePrice.sellPrice,
                            targetFrom: targetPrice.quoteAsset,
                            targetTo: targetPrice.baseAsset,
                            targetPrice: targetPrice.buyPrice,
                            markUpPct: (targetPrice.buyPrice - sourcePrice.sellPrice) / sourcePrice.sellPrice
                        });
                    }
                });
            }
        });
        const sourceColor = (s) => colors.blue(colors.bgYellow(s));
        const targetColor = (s) => colors.white(colors.bgMagenta(s));
        console.table(`${sourceEx.name} vs ${targetEx.name} with Base Asset ${baseAsset}`, compareResult.map(cr => ({
            sourceFrom: sourceColor(cr.sourceFrom),
            'buy': sourceColor(cr.sourcePrice.toString() + ' ' + baseAsset),
            sourceTo: sourceColor(cr.sourceTo),
            targetFrom: targetColor(cr.targetFrom),
            'sell': targetColor(cr.targetPrice.toString() + ' ' + baseAsset),
            targetTo: targetColor(cr.targetTo),
            pct: cr.markUpPct > 0.1 ? colors.green(colors.bgRed(`${(cr.markUpPct * 100).toFixed(2)}%`)) : colors.black(colors.bgWhite(`${(cr.markUpPct * 100).toFixed(2)}%`))
        })));
    }
    catch (e) {
        console.error(e);
    }
});
init().then(() => {
    timers_1.setInterval(exec, 60 * 1000);
});
//# sourceMappingURL=index.js.map