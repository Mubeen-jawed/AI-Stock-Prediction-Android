// const predictPrice = require("../services/predictionService.js").predictPrice;

// const predictPriceController = async (req, res) => {
//   try {
//     const { features } = req.body;
//     console.log("features", features);
//     const result = await predictPrice(features);
//     res.json(result);
//   } catch (err) {
//     res.status(500).json({ error: err.toString() });
//   }
// };
// routes/predictRoute.js
const { fetchStockData } = require("../services/stockService");
const { spawn } = require("child_process");
const path = require("path");

const predictPriceController = async (req, res) => {
  try {
    const ticker = req.params.ticker;
    const features = await fetchStockData(ticker);

    // Path to Python inside venv
    const python = path.join(
      __dirname,
      "..",
      "..",
      "ai-models",
      "price-prediction",
      "venv",
      "Scripts",
      "python.exe"
    );

    // Path to Python script
    const pythonScript = path.join(
      __dirname,
      "..",
      "..",
      "ai-models",
      "price-prediction",
      "predict_price.py"
    );

    const pyProcess = spawn(python, [pythonScript]);

    let pythonOutput = "";
    pyProcess.stdout.on("data", (data) => {
      pythonOutput += data.toString();
    });

    pyProcess.stderr.on("data", (data) => {
      console.error("Python error:", data.toString());
    });

    pyProcess.on("close", () => {
      res.json({ prediction: pythonOutput.trim() });
    });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};

module.exports = { predictPriceController };
