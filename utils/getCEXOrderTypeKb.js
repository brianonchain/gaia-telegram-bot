const getCEXOrderTypeKeyboard = async () => {
  let keyboard = [
    [
      { text: "market buy", callback_data: "market_buy" },
      { text: "market sell", callback_data: "market_sell" },
    ],
    [
      { text: "limit buy", callback_data: "limit_buy" },
      { text: "limit sell", callback_data: "limit_sell" },
    ],
    [{ text: "❌ Exit", callback_data: "exit" }],
  ];

  return keyboard;
};

module.exports = getCEXOrderTypeKeyboard;
