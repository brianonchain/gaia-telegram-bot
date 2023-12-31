const express = require("express");
const axios = require("axios");
require("dotenv").config();
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.telegram.setWebhook(process.env.URL);
bot.startWebhook("/", null, 5000); // can't be same port as listening

bot.command("start", (ctx) => {
  bot.telegram.sendMessage(ctx.chat.id, "Hello there! Welcome to the Code Capsules telegram bot.\nI respond to /ethereum. Please try it", {});
});

bot.command("ETH", (ctx) => {
  axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`).then((response) => {
    console.log(response.data);
    const rate = response.data.ethereum;
    bot.telegram.sendMessage(ctx.chat.id, `Hello, today the ethereum price is ${rate.usd}USD`);
  });
});

const helpItems = ["/start - welcome message", "/ETH - get ETH price", "/quit - to stop the bot", "/trade - trade coins"];
let helpString = "";
for (const item of helpItems) {
  helpString = helpString + "\n" + item;
}
bot.help((ctx) => {
  ctx.reply(helpString);
});

// bot.launch();

// // IF EXPRESS IS NEEDED
// const app = express();
// app.use(express.json());
// app.use(bot.webhookCallback("/"));
// app.get("/", (req, res) => {
//   res.sendStatus(200);
// });
// app.listen(process.env.PORT, () => {
//   console.log(`listening on port ${process.env.PORT}`);
// });
