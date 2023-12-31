const express = require("express");
const axios = require("axios");
require("dotenv").config();
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.telegram.setWebhook(process.env.URL);
bot.startWebhook("/", null, 5000); // can't be same port as listening

bot.command("start", (ctx) => {
  bot.telegram.sendMessage(ctx.chat.id, "Welcome to Gaia Trading Bot");
});

// bot.command("trade", async (ctx) => {
//   return await ctx.replyWithHTML(
//     "<b>Choose an exchange:</b>",
//     Markup.keyboard([
//       ["Binance", "OKX", "Coinbase"],
//       ["Matcha Aggregator", "Jupiter Aggregator (Solana)"],
//     ])
//       .oneTime()
//       .resize()
//   );
// });

bot.command("eth", (ctx) => {
  axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`).then((response) => {
    console.log(response.data);
    const rate = response.data.ethereum;
    bot.telegram.sendMessage(ctx.chat.id, `Hello, today the ethereum price is ${rate.usd}USD`);
  });
});

const commands = [
  {
    command: "trade",
    description: "trade any token",
  },
  {
    command: "exchanges",
    description: "see list of integrated exchanges",
  },
  {
    command: "fees",
    description: "description of all system fees",
  },
  {
    command: "quit",
    description: "to stop the bot",
  },

  {
    command: "more",
    description: "moretest",
  },
];
bot.telegram.setMyCommands(commands);

let helpReply = "";
for (const command of commands) {
  helpReply = helpReply + "\n" + "/" + command.command + " - " + command.description;
}
bot.help((ctx) => {
  ctx.reply(helpReply);
});

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
