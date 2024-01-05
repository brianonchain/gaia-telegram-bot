const express = require("express");
const axios = require("axios");
require("dotenv").config();
const { Telegraf, session, Scenes } = require("telegraf");
// import helper functions
const { getStartKb, getBalanceString, getCEXOrderTypeKb, checkBaseToken, checkQuoteToken, staticKbs, staticStrings } = require("./utils");
const marketOrder = require("./trade/marketOrder.js");

const bot = new Telegraf(process.env.BOT_TOKEN);

const WizCEXMarket = new Scenes.WizardScene(
  "CEXmarket",
  async (ctx) => {
    const orderType = ctx.callbackQuery.data.split("_")[0];
    ctx.session.trade.orderType = orderType;
    ctx.session.trade.side = ctx.callbackQuery.data.split("_")[1];

    await ctx.reply(
      `My order (incomplete)\n${ctx.session.trade.exchange} ${ctx.session.trade.market} ${ctx.session.trade.orderType} ${ctx.session.trade.side}\n\nEnter amount of token to ${ctx.session.trade.side} (example: 1000 DOGE)`,
      {
        reply_markup: {
          inline_keyboard: [staticKbs.partial.backExit],
        },
      }
    );
    return ctx.wizard.next();
  },

  async (ctx) => {
    if (ctx.callbackQuery?.data == "back") {
      await ctx.scene.leave();
      delete ctx.session.trade.orderType;
      delete ctx.session.trade.side;
      // order type keyboard
      const CEXOrderTypeKb = await getCEXOrderTypeKb();
      ctx.telegram.sendMessage(ctx.chat.id, `My order (incomplete)\n${ctx.session.trade.exchange} ${ctx.session.trade.market}\n\nNow, select an order type:`, {
        reply_markup: {
          inline_keyboard: CEXOrderTypeKb,
        },
      });
      return;
    } else if (ctx.callbackQuery?.data == "exit") {
      ctx.session.trade = {};
      await ctx.scene.leave();
      // start message
      const keyboard = await getStartKb();
      ctx.telegram.sendMessage(ctx.chat.id, staticStrings.start, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
      return;
    }

    // validate base token
    const text = ctx.message.text;
    const isTwoWords = text.split(" ").length == 2;
    const isFirstWordNumber = Number.isNaN(Number(text.split("_")[0]));
    const isBaseTokenAvailable = await checkBaseToken(ctx.session.trade.exchange);
    if (!isTwoWords || !isFirstWordNumber) {
      ctx.reply("Please enter valid token amount and token name");
      return;
    }
    if (!isBaseTokenAvailable) {
      ctx.reply(`${text.split("_")[0]} is not an available token on ${ctx.session.trade.exchange.toUpperCase()} EXCHANGE`);
      return;
    }

    // validate success and proceed
    const baseTokenAmount = text.split(" ")[0];
    const baseToken = text.split(" ")[1];
    ctx.session.trade.baseTokenAmount = baseTokenAmount;
    ctx.session.trade.baseToken = baseToken;
    await ctx.reply(
      `My order (incomplete)\n${ctx.session.trade.exchange} ${ctx.session.trade.market} ${ctx.session.trade.orderType} ${ctx.session.trade.side} ${ctx.session.trade.baseTokenAmount} ${ctx.session.trade.baseToken}\n\nNow, enter your quote token or currency (e.g., USDT, USDC, USD, EUR, etc.)`,
      {
        reply_markup: {
          inline_keyboard: [staticKbs.partial.backExit],
        },
      }
    );
    return ctx.wizard.next();
  },

  async (ctx) => {
    // handle back and exit buttons
    if (ctx.callbackQuery?.data == "back") {
      // clear previous data
      delete ctx.session.trade.baseToken;
      delete ctx.session.trade.baseTokenAmount;
      ctx.wizard.back();
      // reply with previous message
      await ctx.reply(
        `My order (incomplete)\n${ctx.session.trade.exchange} ${ctx.session.trade.market} ${ctx.session.trade.orderType} ${ctx.session.trade.side}\n\nEnter amount of token to ${ctx.session.trade.side} (example: 1000 DOGE)`,
        {
          reply_markup: {
            inline_keyboard: [staticKbs.partial.backExit],
          },
        }
      );
      return;
    } else if (ctx.callbackQuery?.data == "exit") {
      // clear previous data and leave wizard
      ctx.session.trade = {};
      await ctx.scene.leave();
      // reply with start message
      const keyboard = await getStartKb();
      ctx.reply(staticStrings.start, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
      return;
    }

    // validate quote token
    const text = ctx.message.text;
    const isOneWord = text.split(" ").length == 1;
    const isQuoteTokenAvailable = await checkQuoteToken(ctx.session.trade.exchange);
    if (!isOneWord) {
      ctx.reply("Please enter a valid quote token or currency name");
      return;
    }
    if (!isQuoteTokenAvailable) {
      ctx.reply(`${text} is not an available quote token or currency on ${ctx.session.trade.exchange.toUpperCase()} EXCHANGE`);
      return;
    }

    // validation=success and proceed
    ctx.session.trade.quoteToken = text;
    await ctx.reply(
      `My Order (complete)\n${ctx.session.trade.exchange} ${ctx.session.trade.market} ${ctx.session.trade.orderType} ${ctx.session.trade.side} ${ctx.session.trade.baseTokenAmount} ${ctx.session.trade.baseToken} using ${ctx.session.trade.quoteToken}\n\nDo you want to submit the above order?`,
      {
        reply_markup: {
          inline_keyboard: [staticKbs.partial.backExit, [{ text: "Submit Order", callback_data: "submit" }]],
        },
      }
    );
    return ctx.wizard.next();
  },

  async (ctx) => {
    if (ctx.callbackQuery?.data == "back") {
      // clear previous data
      delete ctx.session.trade.quoteToken;
      ctx.wizard.back();
      // reply with previous message
      await ctx.reply(
        `My Order (incomplete)\n${ctx.session.trade.exchange} ${ctx.session.trade.market} ${ctx.session.trade.orderType} ${ctx.session.trade.side} ${ctx.session.trade.baseTokenAmount} ${ctx.session.trade.baseToken}\n\nNow, enter your quote token or currency (e.g., USDT, USDC, USD, EUR, etc.)`,
        {
          reply_markup: {
            inline_keyboard: [staticKbs.partial.backExit],
          },
        }
      );
      return;
    } else if (ctx.callbackQuery?.data == "exit") {
      // clear previous data and leave wizard
      ctx.session.trade = {};
      await ctx.scene.leave();
      // reply with start message
      const keyboard = await getStartKb();
      ctx.reply(staticStrings.start, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
      return;
    } else if (ctx.callbackQuery?.data == "submit") {
      //submit order here
      await marketOrder(ctx);
      ctx.reply("Order executed");
      ctx.session.trade = {};
      await ctx.scene.leave();
      // reply with start message after 3s
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const keyboard = await getStartKb();
      ctx.reply(staticStrings.start, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
    }
  }
);

const stage = new Scenes.Stage([WizCEXMarket]);

// define middleware
bot.use(session());
bot.use(stage.middleware());

bot.telegram.setWebhook(process.env.URL);
bot.startWebhook("/", null, 5000); // can't be same port as listening

bot.command("start", async (ctx) => {
  if (!ctx.session.settings) {
    ctx.session = { trade: {}, settings: { binance: {}, coinbase: {}, okx: {}, bybit: {} }, wallet: { address: {}, privateKey: {} } };
  }
  const keyboard = await getStartKb();
  ctx.telegram.sendMessage(ctx.chat.id, staticStrings.start, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
});

bot.action("balance", async (ctx) => {
  let balanceString = await getBalanceString();
  ctx.telegram.sendMessage(ctx.chat.id, balanceString, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "Google Sheets", url: "https://docs.google.com/spreadsheets/d/1XY-sjWPj03bw5mIbJrupfJJ9tMBGIiHkCIrT9DVMI9U/edit#gid=0" }]],
    },
  });
});

bot.on("callback_query", async (ctx) => {
  const query = ctx.callbackQuery.data;

  if (["Binance_spot", "Binance_futures", "Coinbase_spot", "Coinbase_futures", "OKX_spot", "OKX_futures", "ByBit_spot", "ByBit_futures"].includes(query)) {
    const exchange = query.split("_")[0];
    const market = query.split("_")[1];
    ctx.session.trade = { exchange: exchange };
    ctx.session.trade.market = market;
    ctx.telegram.sendMessage(ctx.chat.id, `My order (incomplete)\n${ctx.session.trade.exchange} ${ctx.session.trade.market}\n\nNow, select an order type:`, {
      reply_markup: {
        inline_keyboard: staticKbs.full.CEXOrderType,
      },
    });
  }

  if (["matcha", "jupiter"].includes(query)) {
    ctx.session.trade = { exchange: query };
    const DEXOrderTypeKb = await getDEXOrderTypeKb();
    ctx.telegram.sendMessage(ctx.chat.id, `My order (incomplete)\n${ctx.session.trade.exchange}`, {
      reply_markup: {
        inline_keyboard: DEXOrderTypeKb,
      },
    });
  }

  if (["market_buy", "market_sell", "limit_buy", "limit_sell"].includes(query)) {
    const orderType = query.split("_")[0];
    ctx.scene.enter(`CEX${orderType}`);
  }

  if (query == "settings") {
    if (!ctx.session.settings) {
      ctx.session.settings = {};
    }
    ctx.reply("Select an option", { reply_markup: { inline_keyboard: staticKbs.full.settings } });
  }

  if (query == "cexInfo") {
    ctx.reply("Select an option", { reply_markup: { inline_keyboard: staticKbs.full.cexInfo } });
  }

  if (["binanceInfo", "coinbaseInfo", "OKXInfo", "bybitInfo"].includes(query)) {
    const exchangeLower = query.split("Info")[0];
    const exchange = exchangeLower.toUpperCase();
    if (!ctx.session.settings[exchangeLower]) {
      ctx.session.settings[exchangeLower] = {};
    }
    ctx.reply(
      `Set your API Key, Secret Key, and Password by sending the following messages:\n${exchange}_API=xxxxx\n${exchange}_SECRET=xxxxx\n${exchange}_PASSWORD=xxxxx\n*xxxxx should be replaced by the appropriate value`
    );
  }

  if (["walletInfo"].includes(query)) {
    ctx.reply(
      "set your wallet address and private key by sending the following messages:\nWALLET_ADDRESS=xxxxx\nWALLET_PRIVATE_KEY=xxxxx\nxxxxx should be replaced by the appropriate value"
    );
  }

  if (query == "exit") {
    // copy start
    ctx.session.trade = {};
    const startKb = await getStartKb();
    ctx.reply(staticStrings.start, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: startKb,
      },
    });
  }

  if (query == "help") {
    ctx.reply(staticStrings.help, { parse_mode: "HTML" });
  }
});

bot.on("message", async (ctx) => {
  const text = ctx.message.text;

  if (text.split("=")[0] === "BINANCE_API") {
    ctx.session.settings.binance.api = text.split("=")[1];
    ctx.reply("Binance API Key set");
  }
  if (text.split("=")[0] === "BINANCE_SECRET") {
    ctx.session.settings.binance.secret = text.split("=")[1];
    ctx.reply("Binance Secret Key set");
  }
  if (text.split("=")[0] === "BINANCE_PASSWORD") {
    ctx.session.settings.binance.password = text.split("=")[1];
    ctx.reply("Binance password set");
  }
});

bot.command("balance", async (ctx) => {
  let balanceString = await getBalances();
  let keyboard = await getBalanceKeyboard();
  ctx.telegram.sendMessage(ctx.chat.id, balanceString, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
});

bot.command("id", async (ctx) => {
  console.log("tiggered");
  const id = ctx.update.message.from.id.toString();
  console.log("id", id);
  ctx.reply(id);
});

bot.help((ctx) => {
  ctx.reply(staticStrings.help, { parse_mode: "HTML" });
});

const commands = [
  {
    command: "start",
    description: "main menu",
  },
  {
    command: "balance",
    description: "your balance",
  },
  {
    command: "settings",
    description: "view settings and keys",
  },
  {
    command: "help",
    description: "documentation",
  },
];
bot.telegram.setMyCommands(commands);

// bot.launch();

const app = express();

app.use(express.json());
app.use(bot.webhookCallback("/"));

app.get("/", (req, res) => {
  res.sendStatus(200);
});

app.listen(process.env.PORT, () => {
  console.log(`listening on port ${process.env.PORT}`);
});
