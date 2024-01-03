const staticKbs = {
  partial: {
    backExit: [
      { text: "⬅️ Back", callback_data: "back" },
      { text: "❌ Exit", callback_data: "exit" },
    ],
  },
  full: {
    CEXOrderType: [
      [
        { text: "🟢 market buy", callback_data: "market_buy" },
        { text: "🔴 market sell", callback_data: "market_sell" },
      ],
      [
        { text: "🟩 limit buy", callback_data: "limit_buy" },
        { text: "🟥 limit sell", callback_data: "limit_sell" },
      ],
      [{ text: "❌ Exit", callback_data: "exit" }],
    ],
    settings: [
      [{ text: "CEX API Keys and Passwords", callback_data: "cexInfo" }],
      [{ text: "Wallet Address and Private Key", callback_data: "walletInfo" }],
      [{ text: "Main Menu Buttons", callback_data: "main_buttons" }],
      [{ text: "Quote Token/Currency Buttons", callback_data: "quote_buttons" }],
      [{ text: "❌ Exit", callback_data: "exit" }],
    ],
    cexInfo: [
      [{ text: "Binance", callback_data: "binanceInfo" }],
      [{ text: "Coinbase", callback_data: "coinbaseInfo" }],
      [{ text: "OKX", callback_data: "OKXInfo" }],
      [{ text: "ByBit", callback_data: "ByBitInfo" }],
      [
        { text: "⬅️ Back", callback_data: "back" },
        { text: "❌ Exit", callback_data: "exit" },
      ],
    ],
  },
};

module.exports = staticKbs;
