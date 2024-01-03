const getStartString = require("./getStartString.js");
const getStartKb = require("./getStartKb.js");
const getBalanceString = require("./getBalanceString.js");
const getCEXOrderTypeKb = require("./getCEXOrderTypeKb.js");
const checkBaseToken = require("./checkBaseToken.js");
const checkQuoteToken = require("./checkQuoteToken.js");
const staticKbs = require("./staticKbs.js");
const staticStrings = require("./staticStrings.js");

module.exports = { getStartString, getStartKb, getBalanceString, getCEXOrderTypeKb, checkBaseToken, checkQuoteToken, staticKbs, staticStrings };
