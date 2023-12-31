const express = require("express");
const axios = require("axios");
require("dotenv").config();
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command("start", (ctx) => {
  console.log(ctx);
  // console.log("from:", ctx.from);
  bot.telegram.sendMessage(ctx.chat.id, "Hello there! Welcome to the Code Capsules telegram bot.\nI respond to /ethereum. Please try it", {});
});

bot.command("ethereum", (ctx) => {
  var rate;
  console.log(ctx.from);
  axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`).then((response) => {
    console.log(response.data);
    rate = response.data.ethereum;
    const message = `Hello, today the ethereum price is ${rate.usd}USD`;
    bot.telegram.sendMessage(ctx.chat.id, message, {});
  });
});

// bot.launch();

const app = express();

// app.use(express.static("static"));
app.use(express.json());
// app.use(webhookCallback(bot, "express"));

bot.telegram.setWebhook(process.env.URL);

app.post("/", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.listen(process.env.PORT, () => {
  console.log(`listening on port ${process.env.PORT}`);
});
