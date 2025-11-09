import numpy as np
import pandas as pd
import yfinance as yf
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "AAPL_lstm.h5")

model = load_model(MODEL_PATH, compile=False)

def predict_price():
    data = yf.download("AAPL", period="60d", interval="1d", auto_adjust=False)

    print("Downloaded data columns:", data.columns)
    print("Data head:\n", data.head())

    if data.empty:
        raise ValueError("No data received from yfinance for AAPL.")

    # 🔧 Fix multi-index column structure
    if isinstance(data.columns, pd.MultiIndex):
        # Drop the 2nd level (ticker), leaving only the price names
        data.columns = data.columns.droplevel(1)

    print("Flattened columns:", data.columns)

    # ✅ Only use features that exist (Adj Close may be missing)
    expected_cols = ["Open", "High", "Low", "Close", "Adj Close", "Volume"]
    features = data[expected_cols].values

    # Scale data
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(features)

    # Take last 60 timesteps as input
    X_input = np.array([scaled_data[-60:]])

    # Predict next closing price
    print("Model input shape:", model.input_shape)
    print("X_input shape:", X_input.shape)
    predicted_scaled = model.predict(X_input)
    # Add padding to inverse transform (we only predicted close)
    dummy = np.zeros((1, len(expected_cols)))
    dummy[0, 3] = float(predicted_scaled.squeeze())
    predicted_price = scaler.inverse_transform(dummy)[0, 3]

    return predicted_price


if __name__ == "__main__":
    predicted_value = predict_price()
    print("Predicted next close price for AAPL:", predicted_value)
