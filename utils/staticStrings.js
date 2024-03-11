const merge = (strings) => {
  let mergedString = "";
  for (const string of strings) {
    mergedString = mergedString + "\n" + string;
  }
  return mergedString;
};

const startLines = [
  "<b>Trade tokens by sending a single message, such as:</b>",
  "binance market buy 100 DOGE using USDT",
  "binance market sell 100 DOGE to USDT",
  "",
  "Or, build a message with the buttons below",
];
let start = merge(startLines);

const helpLines = [
  "<b><u>Trade</u></b>",
  "There are 2 ways to trade:",
  "",
  "1) Send a single message, such as",
  "<i>Binance spot market buy 100 DOGE using USDT</i>",
  "<i>Binance spot market sell 100 DOGE to USDT</i>",
  "The message should have the format:",
  "(exchange) ('spot' or 'futures') (order type) (side) (amount base token) (base token) ('using' or 'to') (quote token)",
  "<u>Allowed Options</u>",
  "(exchanges) can be Binance, Coinbase, OKX, or ByBit",
  "(order type) can be market or limit",
  "(side) can be buy or sell",
  "(amount base token) must be a number",
  "(base token) must be all caps",
  "(quote token) must be all caps",
  "*base token = the token you are buying",
  "*quote token = the token or currency the token is denominated in",
  "*for example, for ETHUSDT, the base token is ETH and the quote token or currency is USDT",
  "",
  "2) Click the available buttons and follow the instructions",
  "",
  "<b><u>Settings (NOT FINISHED)</u></b>",
  "The settings is where you can store API keys, passwords, and wallet information (address and private keys), which are needed for the bot to execute trades. All information is stored in the 'ctx.session' object, which is stored in your device's RAM and not on a cloud storage, so third parties cannot view it. In the Settings, can also modify which button options are shown or hidden. Specifically, you can do the following:",
  "- save your API keys or passwords for each exchange (information is stored in your device's RAM, not on a cloud database",
  "- save your wallet information (wallet address and wallet private keys)",
  "- set the Google Sheets information",
  "- choose which exchanges you want shown or hidden in the main menu",
  "- choose which quote token or currency you want shown or hidden when you are using the buttons to make a trade",
];
let help = merge(helpLines);

const staticStrings = {
  start: start,
  help: help,
};

module.exports = staticStrings;
