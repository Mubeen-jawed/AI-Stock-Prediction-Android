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
const { spawn } = require("child_process");
const path = require("path");

const predictPriceController = async (req, res) => {
  const { ticker } = req.params;
  const days = req.query.days || "7";
  const modelType = req.query.modelType || "lstm"; // lstm / prophet / news-lstm

  const pythonScript = {
    lstm: "predict_price.py",
    prophet: "predict_prophet.py",
    "news-lstm": "predict_news_lstm.py",
  }[modelType];
  const BASE_DIR = path.resolve(__dirname, "..", "..");

  const python = path.resolve(
    BASE_DIR,
    "ai-models",
    "price-prediction",
    ".venv",
    "Scripts",
    "python.exe"
  );

  const scriptPath = path.resolve(
    BASE_DIR,
    "ai-models",
    "price-prediction",
    pythonScript
  );
  console.log(scriptPath, "scriptPath");
  const pyProcess = spawn(python, [scriptPath, ticker, days]);

  let pythonOutput = "";
  pyProcess.stdout.on("data", (data) => (pythonOutput += data.toString()));
  pyProcess.stderr.on("data", (data) =>
    console.error("Python error:", data.toString())
  );

  pyProcess.on("close", () => {
    try {
      if (pythonScript === "predict_price.py") {
        const raw = pythonOutput.trim();

        // If wrapped in array like ['json-string']
        const firstParse = JSON.parse(raw);
        const parsed =
          typeof firstParse === "string" ? JSON.parse(firstParse) : firstParse;

        res.json(parsed);
      } else if (pythonScript === "predict_prophet.py") {
        const parsed = JSON.parse(pythonOutput);
        res.json(parsed);
      }
    } catch (err) {
      res
        .status(500)
        .json({ error: "Invalid Python output", raw: pythonOutput });
    }
  });
};

module.exports = { predictPriceController };
