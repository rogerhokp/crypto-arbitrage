import Bitfinex from '../bitfinex';

const b = new Bitfinex();
b.getAssetList('eth').then(console.log);
// b.getAskPrice('xrp', 'usd').then(console.log);
// b.getAskPrice('xrp', 'eth').then(p => {
//     console.log(p);
//     b.getAskPrice('xrp', 'eth').then(p => {
//         console.log(p);

//     });
// });