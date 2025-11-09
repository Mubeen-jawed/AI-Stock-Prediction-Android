const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stocks: [
      {
        symbol: { type: String, required: true },
        companyName: { type: String },
        quantity: { type: Number, required: true },
        buyPrice: { type: Number, required: true },
        currentPrice: { type: Number, default: 0 },
      },
    ],
    totalValue: { type: Number, default: 0 },
    profitLoss: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Portfolio = mongoose.model("Portfolio", portfolioSchema);
module.exports = { Portfolio };
