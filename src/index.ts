///<reference path="./index.d.ts" />
import Binance from './exchanges/binance';
import Bitfinex from './exchanges/bitfinex';
import Cexio from './exchanges/cexio';
import * as _ from 'lodash';
import * as colors from 'colors';
import { Price, Pair } from './exchanges/exchanges';
import 'console.table';
import { setInterval } from 'timers';

const baseAsset = 'ETH';

const sourceEx = new Binance();
const targetEx = new Cexio();

let sourceExSupportedAssets: Pair[];
let targetExSupportedAssets: Pair[];

const init = async () => {
    await sourceEx.init();
    sourceExSupportedAssets = await sourceEx.getSupportedAssets(baseAsset);

    await targetEx.init();
    targetExSupportedAssets = await targetEx.getSupportedAssets(baseAsset);
}
const exec = (async () => {
    try {

        const sourceExPriceList = await Promise.all(
            sourceExSupportedAssets.map((asset: Pair) => sourceEx.getPrice(asset.baseAsset, asset.quoteAsset))
        );

        //TODO move inside and loop


        const targetExPriceList = await Promise.all(
            targetExSupportedAssets.map((asset: Pair) => targetEx.getPrice(asset.baseAsset, asset.quoteAsset))
        );

        const targetExPriceGroupByBaseAsset = _.groupBy(targetExPriceList, p => p.baseAsset);
        const targetExPriceGroupByQuoteAsset = _.groupBy(targetExPriceList, p => p.quoteAsset);
        const compareResult: ComparePair[] = [];



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
        const sourceColor = (s: string) => colors.blue(colors.bgYellow(s));
        const targetColor = (s: string) => colors.white(colors.bgMagenta(s));

        console.table(`${sourceEx.name} vs ${targetEx.name} with Base Asset ${baseAsset}`, compareResult.map(cr => ({

            sourceFrom: sourceColor(cr.sourceFrom),
            'buy': sourceColor(cr.sourcePrice.toString() + ' ' + baseAsset),
            sourceTo: sourceColor(cr.sourceTo),
            targetFrom: targetColor(cr.targetFrom),
            'sell': targetColor(cr.targetPrice.toString() + ' ' + baseAsset),
            targetTo: targetColor(cr.targetTo),
            pct: cr.markUpPct > 0.1 ? colors.green(colors.bgRed(`${(cr.markUpPct * 100).toFixed(2)}%`)) : colors.black(colors.bgWhite(`${(cr.markUpPct * 100).toFixed(2)}%`))
        })));



    } catch (e) {
        console.error(e);
    }

});
init().then(() => {
    setInterval(exec, 60 * 1000);
});
