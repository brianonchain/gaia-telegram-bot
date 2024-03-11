const ccxt = require("ccxt");
const { google } = require("googleapis");
require("dotenv").config();

const marketOrder = async (ctx) => {
  console.log(ctx.session);
  const binance = new ccxt.binance({
    enableRateLimit: true,
    apiKey: process.env.BINANCE_TESTNET_API_KEY,
    secret: process.env.BINANCE_TESTNET_SECRET_KEY,
  });
  binance.setSandboxMode(true);

  (async () => {
    // execute market order
    const ticker = ctx.session.trade.baseToken + ctx.session.trade.quoteToken;
    const baseToken = ctx.session.trade.baseToken;
    const side = ctx.session.trade.side;
    var order = await binance.createMarketOrder(ticker, ctx.session.trade.side, ctx.session.trade.baseTokenAmount);

    console.log(`bought ${order.filled} ${order.info.symbol} at ${order.average}`);

    // get balances
    const tokenBalance = await binance.fetchBalance().then((balances) => balances.info.balances.find((i) => i.asset === baseToken).free);
    const usdtBalance = await binance.fetchBalance().then((balances) => balances.info.balances.find((i) => i.asset === "USDT").free);

    // post to google sheets
    const auth = new google.auth.GoogleAuth({
      keyFile: "./googlekey.json",
      scopes: "https://www.googleapis.com/auth/spreadsheets",
    });
    const authClientObject = await auth.getClient();
    const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });
    await googleSheetsInstance.spreadsheets.batchUpdate({
      auth,
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      resource: {
        requests: [
          {
            insertRange: {
              range: {
                sheetId: 0,
                startRowIndex: 1,
                endRowIndex: 2,
                startColumnIndex: 0,
                endColumnIndex: 9,
              },
              shiftDimension: "ROWS",
            },
          },
          {
            updateCells: {
              range: {
                sheetId: 0,
                startRowIndex: 1,
                endRowIndex: 2,
                startColumnIndex: 0,
                endColumnIndex: 8,
              },
              rows: [
                {
                  values: [
                    { userEnteredValue: { stringValue: new Date().toLocaleString() } },
                    { userEnteredValue: { stringValue: ticker } },
                    { userEnteredValue: { stringValue: side } },
                    { userEnteredValue: { numberValue: order.filled } },
                    { userEnteredValue: { numberValue: order.average } },
                    { userEnteredValue: { numberValue: order.cost } },
                    { userEnteredValue: { numberValue: tokenBalance } },
                    { userEnteredValue: { numberValue: usdtBalance } },
                  ],
                },
              ],
              fields: "userEnteredValue",
            },
          },
        ],
      },
    });
  })();
};

module.exports = marketOrder;
