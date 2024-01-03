const getStartString = async () => {
  const lines = [
    "<b>Trade tokens by sending a single message, such as:</b>",
    "binance market buy 100 DOGE using USDT",
    "binance market sell 100 DOGE to USDT",
    "",
    "Or, build a message with the buttons below",
  ];
  let startString = "";
  for (const line of lines) {
    startString = startString + "\n" + line;
  }
  return startString;
};
module.exports = getStartString;
