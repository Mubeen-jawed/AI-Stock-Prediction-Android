import pandas as pd
from prophet import Prophet
import sys, json
import os
import joblib

def predict_prophet(symbol, days=7):
    BASE_PATH = os.path.dirname(os.path.abspath(__file__))
    MODEL_PATH = os.path.join(BASE_PATH, "models")
    model_file = os.path.join(MODEL_PATH, f"{symbol}_prophet.pkl")
    
    if not os.path.exists(model_file):
        # Fallback error or could trigger training (sticking to error/message for now)
        print(json.dumps({"error": f"Model not found for {symbol}. Please train it first."}))
        return

    # Load model
    model = joblib.load(model_file)

    future = model.make_future_dataframe(periods=days)
    # Filter future to only include the *next* days, not the whole history
    # Correction: predict() returns the whole history + future. We just tail it.
    
    forecast = model.predict(future)

    # Only print JSON at the end
    predictions = forecast[['ds', 'yhat']].tail(days)
    output = [{"date": str(row['ds'].date()), "price": float(row['yhat'])} 
              for _, row in predictions.iterrows()]

    print(json.dumps({"ticker": symbol, "days": days, "prediction": output}))
   

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No symbol provided"}))
        sys.exit(1)
        
    symbol = sys.argv[1]
    days = int(sys.argv[2]) if len(sys.argv) > 2 else 7
    predict_prophet(symbol, days)
