const { Telegraf, session, Scenes } = require("telegraf");
require("dotenv").config();
// import helper functions
const { getStartKb, getBalanceString, getCEXOrderTypeKb, staticKbs, staticStrings } = require("./utils");
const marketOrder = require("./trade/marketOrder.js");

// Creates a new Telegraf instance. Telegraf is a wrapper for the Telegram APIs. Another popular library is node-telegram-bot-api
const bot = new Telegraf(process.env.BOT_TOKEN);

/************************************** WIZARD, SCENE, STAGE **************************************/
// a Wizard Scene allows you to construct a step-by-step path when users clicks a menu button. For example, if user clicks Button A,
// they will see Button Y and Button Z. If they click Button B, they will see Button W and Button X.
// Here, we create a Wizard Scene called "WizCEXMarket". This Wizard launches when user clicks "Binance Spot" in the /start menu
const CEXmarketWizardScene = new Scenes.WizardScene(
  "CEXmarket",
  async (ctx) => {
    console.log("entering CEXmarket Wizard Scene");
    // extract variable
    const orderType = ctx.callbackQuery.data.split("_")[0];
    const side = ctx.callbackQuery.data.split("_")[1];
    // write to local session storage
    ctx.session.trade.orderType = orderType;
    ctx.session.trade.side = side;

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

    ////// User now enters amount of token to buy/sell
    const text = ctx.message.text;
    //// performing checks first
    // check errors in text message
    const isTwoWords = text.split(" ").length == 2; // check if message is exactly 2 words
    const isFirstWordNumber = Number.isNaN(Number(text.split("_")[0])); // check if first word is a number
    // const isBaseTokenAvailable = await checkBaseToken(ctx.session.trade.exchange); // check if tokesn are available on exchange
    // throw error if checks do not pass
    if (!isTwoWords || !isFirstWordNumber) {
      ctx.reply("Please enter valid token amount and token name");
      return;
    }
    // if (!isBaseTokenAvailable) {
    //   ctx.reply(`${text.split("_")[0]} is not an available token on ${ctx.session.trade.exchange.toUpperCase()} EXCHANGE`);
    //   return;
    // }

    // extract variables
    const baseTokenAmount = text.split(" ")[0];
    const baseToken = text.split(" ")[1];
    // write to local session storage
    ctx.session.trade.baseTokenAmount = baseTokenAmount;
    ctx.session.trade.baseToken = baseToken;
    // reply
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

    ////// user now enters quote token
    const text = ctx.message.text;
    // checks
    const isOneWord = text.split(" ").length == 1;
    // const isQuoteTokenAvailable = await checkQuoteToken(ctx.session.trade.exchange);
    if (!isOneWord) {
      ctx.reply("Please enter a valid quote token or currency name");
      return;
    }
    // if (!isQuoteTokenAvailable) {
    //   ctx.reply(`${text} is not an available quote token or currency on ${ctx.session.trade.exchange.toUpperCase()} EXCHANGE`);
    //   return;
    // }

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
const stage = new Scenes.Stage([CEXmarketWizardScene]); // append all "scenes" to "stage"
/******************** WIZARD, SCENE, STAGE (END) **************************************/

/****************************** BOT SETUP *********************************************/
console.log("listening on port:", process.env.PORT);
bot.use(session()); // use session middleware, so we can store local data in Telegram bot
bot.use(stage.middleware()); // integrate "stage" (thus our Wizard Scenes) as a middleware

// if not in development mode, then activate Telegram to start listening to webhooks
if (process.env.PORT != "8080") {
  console.log("start listening to webhooks");
  bot.telegram.setWebhook(process.env.URL); // set webhook URL to Heroku App URL
  bot.startWebhook("/", null, process.env.PORT || 5000); // start listening for webhooks, can't listen to same port as nodejs app
}
/***************************** BOT SETUP (END) ****************************************/

/******************************* BOT COMMANDS *****************************************/
bot.command("start", async (ctx) => {
  // if session.settings does not exist, then define it
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

bot.command("balance", async (ctx) => {
  let balanceString = await getBalanceString();
  // let keyboard = await getBalanceKeyboard();
  ctx.telegram.sendMessage(ctx.chat.id, balanceString, {
    parse_mode: "HTML",
  });
});

bot.command("settings", async (ctx) => {
  if (!ctx.session.settings) {
    ctx.session.settings = {};
  }
  ctx.reply("Select an option", { reply_markup: { inline_keyboard: staticKbs.full.settings } });
});

// define the help command (this way of defining a command is different than the above)
bot.help((ctx) => {
  ctx.reply(staticStrings.help, { parse_mode: "HTML" });
});

// commands are "/command" messages to trigger an action. When you press "Menu" button, all commands will show.
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
/************************************** BOT COMMANDS (END) ************************************/

/*************************************** KEYBOARD BUTTONS ***********************************/
// Here is the logic whenever ANY keyboard button is pressed
// ctx.callbackQuery.data = query = the text in the "callback_data" associated any keyboard button
bot.on("callback_query", async (ctx) => {
  const query = ctx.callbackQuery.data;

  if (["Binance_spot", "Binance_futures", "Coinbase_spot", "Coinbase_futures", "OKX_spot", "OKX_futures", "ByBit_spot", "ByBit_futures"].includes(query)) {
    // extract variables
    const exchange = query.split("_")[0];
    const market = query.split("_")[1];
    // store variables into session storage
    ctx.session.trade = { exchange: exchange };
    ctx.session.trade.market = market;
    // reply with message and keyboard
    ctx.telegram.sendMessage(ctx.chat.id, `My order (incomplete)\n${ctx.session.trade.exchange} ${ctx.session.trade.market}\n\nNow, select an order type:`, {
      reply_markup: {
        inline_keyboard: staticKbs.full.CEXOrderType,
      },
    });
  }

  if (["matcha", "jupiter"].includes(query)) {
    // store variables into session storage
    ctx.session.trade = { exchange: query };
    // reply with message and keyboard
    const DEXOrderTypeKb = await getDEXOrderTypeKb();
    ctx.telegram.sendMessage(ctx.chat.id, `My order (incomplete)\n${ctx.session.trade.exchange}`, {
      reply_markup: {
        inline_keyboard: DEXOrderTypeKb,
      },
    });
  }

  // enter the "CEXmarket" Wizard Scene
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

  if (query === "balance") {
    let balanceString = await getBalanceString();
    // let keyboard = await getBalanceKeyboard();
    ctx.telegram.sendMessage(ctx.chat.id, balanceString, {
      parse_mode: "HTML",
    });
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
/****************************************** KEYBOARD BUTTONS (END) ************************************/

// // storing secrets in local storage
// bot.on("message", async (ctx) => {
//   const text = ctx.message.text;

//   if (text.split("=")[0] === "BINANCE_API") {
//     ctx.session.settings.binance.api = text.split("=")[1];
//     ctx.reply("Binance API Key set");
//   }
//   if (text.split("=")[0] === "BINANCE_SECRET") {
//     ctx.session.settings.binance.secret = text.split("=")[1];
//     ctx.reply("Binance Secret Key set");
//   }
//   if (text.split("=")[0] === "BINANCE_PASSWORD") {
//     ctx.session.settings.binance.password = text.split("=")[1];
//     ctx.reply("Binance password set");
//   }
// });

/******************************************** FOR LOCAL DEVELOPMENT  **********************************************/
// Can't use webhook in local development. If using bot.launch(), Telegram listens to incoming messsages through "polling".
// When starting the bot in local (node main.js), we can use bot.launch().
// Heroku will set port to number other than 8080. So, if PORT=8080, then use bot.launch().
if (process.env.PORT == "8080") {
  console.log("activate bot.launch()");
  bot.launch();
}
/******************************************************************************************************************/
