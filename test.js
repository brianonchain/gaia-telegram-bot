const ccxt = require("ccxt");
require("dotenv").config();

const getBalances = async () => {
  // get binance balance
  const binance = new ccxt.binance({
    enableRateLimit: true,
    apiKey: process.env.BINANCE_KEY,
    secret: process.env.BINANCE_SECRET,
  });
  binance.setSandboxMode(true);

  const binanceBalances = (await binance.fetchBalance()).info.balances;

  let binanceNonZeroBalance = [];
  for (const binanceBalance of binanceBalances) {
    if (binanceBalance.free > 0.001) {
      let object = {};
      object.text = binanceBalance.asset;
      object.callback = binanceBalance.asset;
      object.balance = binanceBalance.free;
      binanceNonZeroBalance.push(object);
    }
  }

  return binanceNonZeroBalance;
};
getBalances();
