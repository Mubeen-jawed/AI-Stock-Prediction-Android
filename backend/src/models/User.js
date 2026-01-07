const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    watchlist: {
      type: [
        {
          symbol: { type: String, required: true, uppercase: true, trim: true },

          // snapshot fields you want to store
          name: { type: String, default: null },
          logo: { type: String, default: null },
          price: { type: Number, default: null },
          changePercent: { type: Number, default: null },

          // timestamps
          addedAt: { type: Date, default: Date.now },
          lastSyncedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = { User };
