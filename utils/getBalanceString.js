const ccxt = require("ccxt");
require("dotenv").config();

const getBalanceString = async () => {
  // get binance balance
  const getBinanceBalanceString = async () => {
    const binance = new ccxt.binance({
      enableRateLimit: true,
      apiKey: process.env.BINANCE_TESTNET_API_KEY,
      secret: process.env.BINANCE_TESTNET_SECRET_KEY,
    });
    binance.setSandboxMode(true);

    const binanceBalances = (await binance.fetchBalance()).info.balances;
    console.log(binanceBalances);

    // create balance string, but limit to 20 or Telegram message limit will be exceeded
    let binanceBalanceString = "<b>Binance</b>";
    let count = 0;
    for (const binanceBalance of binanceBalances) {
      if (binanceBalance.free > 0.001) {
        binanceBalanceString = binanceBalanceString + "\n" + binanceBalance.asset + ": " + binanceBalance.free;
        count++;
        if (count > 20) {
          binanceBalanceString = binanceBalanceString + "\n" + `...${binanceBalances.length - 20} more items`;
          break;
        }
      }
    }

    return binanceBalanceString;
  };

  const binanceBalanceString = await getBinanceBalanceString();

  return binanceBalanceString;
};

module.exports = getBalanceString;
