import Binance from '../binance';

const b = new Binance();
b.getAssetList('eth').then(console.log);
// b.getBidPrice('eth', 'xrp').then(console.log);
// b.getAskPrice('xrp', 'eth').then(p => {
//     console.log(p);
//     b.getAskPrice('xrp', 'eth').then(p => {
//         console.log(p);

//     });
// });