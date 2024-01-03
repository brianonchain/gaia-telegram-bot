const ccxt = require("ccxt");
require("dotenv").config();

const getBalanceString = async () => {
  // get binance balance
  const getBinanceBalanceString = async () => {
    const binance = new ccxt.binance({
      enableRateLimit: true,
      apiKey: process.env.BINANCE_KEY,
      secret: process.env.BINANCE_SECRET,
    });
    binance.setSandboxMode(true);

    const binanceBalances = (await binance.fetchBalance()).info.balances.slice(0, 20);

    let binanceBalanceString = "<b>Binance</b>\n";
    for (const binanceBalance of binanceBalances) {
      if (binanceBalance.free > 0.001) {
        binanceBalanceString = binanceBalanceString + binanceBalance.asset + ": " + binanceBalance.free + "\n";
      }
    }

    return binanceBalanceString;
  };

  const binanceBalanceString = await getBinanceBalanceString();

  // get coinbase balance
  // get okx balance
  // get bybit balance
  // get wallet balance

  const balance = binanceBalanceString;

  return balance;
};
// getBalances();
module.exports = getBalanceString;
