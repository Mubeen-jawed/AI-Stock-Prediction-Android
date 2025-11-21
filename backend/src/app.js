const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes.js");
const portfolioRoutes = require("./routes/portfolioRoutes.js");
const stockRoutes = require("./routes/stockRoutes.js");
const predictRoutes = require("./routes/predictRoutes.js");
const newsRoutes = require("./routes/newsRoutes.js");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/news", newsRoutes);
app.use("/predict", predictRoutes);
// app.post("/predict", async (req, res) => {
//   try {
//     const { features } = req.body;
//     const result = await predictPrice(features);
//     res.json(result);
//   } catch (err) {
//     res.status(500).json({ error: err.toString() });
//   }
// });
app.get("/", (req, res) => {
  res.send("AI Stock Portfolio Manager Backend Running 🚀");
});
module.exports = app;
