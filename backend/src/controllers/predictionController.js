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
const os = require("os");

const predictPriceController = async (req, res) => {
  const { ticker } = req.params;
  const days = req.query.days || "7";
  const modelType = req.query.modelType || "lstm"; // lstm / prophet / news-lstm

  const pythonScript = {
    lstm: "predict_price.py",
    prophet: "predict_prophet.py",
    "news-lstm": "predict_news_lstm.py",
  }[modelType];

  if (!pythonScript) {
    return res.status(400).json({ error: "Invalid modelType" });
  }

  const BASE_DIR = path.resolve(__dirname, "..", "..");

  // Prefer system python on Linux deployments; use venv on Windows dev
  const isWindows = os.platform() === "win32";

  // If you want to always use venv on both OS, set pythonPathLinux to ".venv/bin/python"
  const pythonExecutable = isWindows ? "python.exe" : "python3";

  const pythonPathWindows = path.resolve(
    BASE_DIR,
    "ai-models",
    "price-prediction",
    ".venv",
    "Scripts",
    "python.exe"
  );

  const pythonPathLinuxVenv = path.resolve(
    BASE_DIR,
    "ai-models",
    "price-prediction",
    ".venv",
    "bin",
    "python"
  );

  // Choose python:
  // - Windows: venv python.exe
  // - Linux: python3 (most reliable on Koyeb) OR linux venv if you created it during build
  const python = isWindows ? pythonPathWindows : pythonExecutable;

  // If you'd rather use linux venv (only if it exists on Koyeb), swap this line:
  // const python = isWindows ? pythonPathWindows : pythonPathLinuxVenv;

  const scriptPath = path.resolve(
    BASE_DIR,
    "ai-models",
    "price-prediction",
    pythonScript
  );

  console.log("Python:", python);
  console.log("Script:", scriptPath);

  const pyProcess = spawn(python, [scriptPath, ticker, days], {
    env: process.env,
  });

  let pythonOutput = "";
  let pythonError = "";

  pyProcess.stdout.on("data", (data) => (pythonOutput += data.toString()));
  pyProcess.stderr.on("data", (data) => (pythonError += data.toString()));

  // IMPORTANT: handle spawn failures (ENOENT etc.) so Node doesn't crash
  pyProcess.on("error", (err) => {
    return res.status(500).json({
      error: "Failed to start Python process",
      details: err.message,
      python,
      scriptPath,
    });
  });

  pyProcess.on("close", (code) => {
    try {
      if (code !== 0) {
        return res.status(500).json({
          error: "Python process failed",
          exitCode: code,
          stderr: pythonError.trim().slice(0, 2000),
          raw: pythonOutput.trim().slice(0, 2000),
        });
      }

      const raw = pythonOutput.trim();

      // handle both: JSON object OR JSON string-wrapped
      const firstParse = JSON.parse(raw);
      const parsed =
        typeof firstParse === "string" ? JSON.parse(firstParse) : firstParse;

      return res.json(parsed);
    } catch (err) {
      return res.status(500).json({
        error: "Invalid Python output",
        parseError: err.message,
        stderr: pythonError.trim().slice(0, 2000),
        raw: pythonOutput.trim().slice(0, 2000),
      });
    }
  });
};

module.exports = { predictPriceController };
