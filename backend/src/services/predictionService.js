const { spawn } = require("child_process");
const path = require("path");

function predictPrice(features) {
  console.log("object");
  return new Promise((resolve, reject) => {
    const pythonPath = path.resolve(
      "D:/Projects/AI-Stock-Prediction-Android/ai-models/price-prediction/venv/Scripts/python.exe"
    );
    const scriptPath = path.resolve(
      "D:/Projects/AI-Stock-Prediction-Android/ai-models/price-prediction/predict_price.py"
    );
    const pythonProcess = spawn(pythonPath, [scriptPath]);

    let dataString = "";

    pythonProcess.stdout.on("data", (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error("Python error:", data.toString());
    });

    pythonProcess.on("close", () => {
      try {
        const result = JSON.parse(dataString);
        resolve(result);
      } catch (err) {
        reject("Invalid Python response: " + dataString);
      }
    });

    // Send input data to Python
    pythonProcess.stdin.write(JSON.stringify({ features }));
    pythonProcess.stdin.end();
  });
}

module.exports = { predictPrice };
