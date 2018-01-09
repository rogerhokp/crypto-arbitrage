
import Binance from './exchanges/binance';
import Bitfinex from './exchanges/bitfinex';
import { Price, Pair } from './exchanges/exchanges';

const baseAsset = 'eth';
const exchanges = ['binance', 'cexio'];

const bitfinex = new Bitfinex();
const binance = new Binance();

(async () => {
    const assetList = await binance.getAssetList(baseAsset);

    const assetPriceList = await Promise.all(assetList.map((asset: Pair) => {
        return binance.getAskPrice(asset.baseAsset, asset.quoteAsset);
    }));

    console.log(assetPriceList);

})();