const getStartKb = async () => {
  const keyboard = [
    [
      { text: "Binance Spot", callback_data: "Binance_spot" },
      { text: "Binance Futures", callback_data: "Binance_futures" },
    ],
    [
      { text: "Coinbase Spot", callback_data: "Coinbase_spot" },
      { text: "Coinbase Futures", callback_data: "Coinbase_futures" },
    ],
    [
      { text: "OKX Spot", callback_data: "OKX_spot" },
      { text: "OKX Futures", callback_data: "OKX_futures" },
    ],
    [
      { text: "Bybit Spot", callback_data: "Bybit_spot" },
      { text: "Bybit Futures", callback_data: "Bybit_futures" },
    ],
    [{ text: "Matcha Aggregator (EVM)", callback_data: "Matcha" }],
    [{ text: "Jupiter Aggregator (Solana)", callback_data: "Jupiter" }],
    [{ text: "📒 My Balance", callback_data: "balance" }],
    [
      { text: "⚙️ Settings", callback_data: "settings" },
      { text: "🙋 Help", callback_data: "help" },
    ],
  ];

  return keyboard;
};
module.exports = getStartKb;
