# from fastapi import FastAPI
# import yfinance as yf
# import pandas as pd
# import numpy as np
# from sklearn.preprocessing import MinMaxScaler
# from tensorflow.keras.models import Sequential
# from tensorflow.keras.layers import LSTM, Dense

# app = FastAPI()

# @app.get("/")
# def root():
#     return {"message": "Price Prediction Model API Running 🚀"}

# @app.post("/predict")
# def predict_price(data: dict):
#     symbol = data.get("symbol", "AAPL")
#     days = data.get("days", 30)

#     df = yf.download(symbol, period="2y")
#     close_prices = df["Close"].values.reshape(-1, 1)

#     # Scale data
#     scaler = MinMaxScaler(feature_range=(0, 1))
#     scaled = scaler.fit_transform(close_prices)

#     # Prepare training data
#     x_train, y_train = [], []
#     for i in range(60, len(scaled)):
#         x_train.append(scaled[i-60:i, 0])
#         y_train.append(scaled[i, 0])
#     x_train, y_train = np.array(x_train), np.array(y_train)
#     x_train = np.reshape(x_train, (x_train.shape[0], x_train.shape[1], 1))

#     # Build LSTM model
#     model = Sequential()
#     model.add(LSTM(50, return_sequences=True, input_shape=(x_train.shape[1], 1)))
#     model.add(LSTM(50, return_sequences=False))
#     model.add(Dense(25))
#     model.add(Dense(1))
#     model.compile(optimizer='adam', loss='mean_squared_error')

#     # Train briefly (for demo)
#     model.fit(x_train, y_train, batch_size=32, epochs=1, verbose=0)

#     # Predict next X days
#     last_60 = scaled[-60:]
#     predictions = []
#     current_input = last_60

#     for _ in range(days):
#         pred = model.predict(current_input.reshape(1, 60, 1), verbose=0)
#         predictions.append(pred[0][0])
#         current_input = np.append(current_input[1:], pred).reshape(60, 1)

#     predictions = scaler.inverse_transform(np.array(predictions).reshape(-1, 1))
#     future_dates = pd.date_range(df.index[-1], periods=days+1, freq="B")[1:]
#     result = [{"date": str(d.date()), "predicted_price": float(p)} for d, p in zip(future_dates, predictions)]

#     return {"symbol": symbol, "predictions": result}
# app_improved.py
# Improved LSTM price prediction service with training, saving, validation, and inference.
# Run: uvicorn app_improved:app --reload

# from fastapi import FastAPI
# from pydantic import BaseModel
# import yfinance as yf
# import numpy as np
# import pandas as pd
# from sklearn.preprocessing import MinMaxScaler
# from sklearn.metrics import mean_squared_error, mean_absolute_percentage_error
# import tensorflow as tf
# from tensorflow.keras.models import Sequential, load_model
# from tensorflow.keras.layers import LSTM, Dense, Dropout
# from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
# import os
# from datetime import timedelta

# app = FastAPI()
# MODEL_DIR = "models"
# os.makedirs(MODEL_DIR, exist_ok=True)

# class PredictRequest(BaseModel):
#     symbol: str
#     days: int = 7
#     retrain: bool = False   # if True, retrain model before predicting
#     lookback: int = 60      # sequence length
#     epochs: int = 30        # training epochs
#     batch_size: int = 32

# # helper: download and prepare dataset (multivariate)
# def download_data(symbol, period="5y"):
#     df = yf.download(symbol, period=period, progress=False)
#     if df.empty:
#         raise ValueError("No data found for symbol: " + symbol)
#     df = df[["Open","High","Low","Close","Volume"]].dropna()
#     # add simple moving average as an extra feature
#     df["SMA_10"] = df["Close"].rolling(window=10).mean().fillna(method="bfill")
#     df = df.dropna()
#     return df

# # create sequences for LSTM
# def create_sequences(data_array, lookback):
#     X, y = [], []
#     for i in range(lookback, len(data_array)):
#         X.append(data_array[i-lookback:i])
#         y.append(data_array[i, 3])  # target: Close column index 3
#     return np.array(X), np.array(y)

# # build model factory
# def build_model(input_shape):
#     model = Sequential()
#     model.add(LSTM(128, return_sequences=True, input_shape=input_shape))
#     model.add(Dropout(0.2))
#     model.add(LSTM(64, return_sequences=False))
#     model.add(Dropout(0.2))
#     model.add(Dense(32, activation="relu"))
#     model.add(Dense(1))
#     model.compile(optimizer="adam", loss="mse")
#     return model

# # training pipeline
# def train_and_save(symbol, lookback=60, epochs=30, batch_size=32):
#     df = download_data(symbol, period="5y")
#     values = df.values  # columns: Open,High,Low,Close,Volume,SMA_10

#     scaler = MinMaxScaler()
#     scaled = scaler.fit_transform(values)

#     X, y = create_sequences(scaled, lookback)

#     # train/val split (80/20)
#     split = int(0.8 * len(X))
#     X_train, y_train = X[:split], y[:split]
#     X_val, y_val = X[split:], y[split:]

#     model = build_model((X_train.shape[1], X_train.shape[2]))

#     model_path = f"{MODEL_DIR}/{symbol}_lstm.h5"
#     scaler_path = f"{MODEL_DIR}/{symbol}_scaler.npy"

#     callbacks = [
#         EarlyStopping(monitor="val_loss", patience=7, restore_best_weights=True),
#         ModelCheckpoint(model_path, monitor="val_loss", save_best_only=True, save_weights_only=False)
#     ]

#     history = model.fit(
#         X_train, y_train,
#         validation_data=(X_val, y_val),
#         epochs=epochs,
#         batch_size=batch_size,
#         callbacks=callbacks,
#         verbose=1
#     )

#     # save scaler: we store min/max arrays (feature-wise)
#     np.save(scaler_path, np.array([scaler.data_min_, scaler.data_max_], dtype=object), allow_pickle=True)

#     # evaluate on validation
#     y_pred_val = model.predict(X_val)
#     # inverse transform predictions and y_val
#     # y_val and y_pred_val correspond to scaled Close values -> we must inverse scale using scaler for Close column
#     # reconstruct arrays to invert scale properly
#     def invert_close(arr_scaled):
#         # arr_scaled is 1d array of scaled close values; we need to build a full-feature dummy to inverse transform
#         dummy = np.zeros((len(arr_scaled), values.shape[1]))
#         # put scaled close at index 3
#         dummy[:, 3] = arr_scaled
#         inv = scaler.inverse_transform(dummy)[:, 3]
#         return inv

#     y_val_inv = invert_close(y_val)
#     y_pred_val_inv = invert_close(y_pred_val.flatten())

#     rmse = mean_squared_error(y_val_inv, y_pred_val_inv, squared=False)
#     mape = mean_absolute_percentage_error(y_val_inv, y_pred_val_inv)

#     return {
#         "model_path": model_path,
#         "scaler_path": scaler_path,
#         "rmse": float(rmse),
#         "mape": float(mape),
#         "history": { "loss": [float(x) for x in history.history["loss"]], "val_loss": [float(x) for x in history.history["val_loss"]] }
#     }

# # load scaler helper
# def load_scaler(scaler_path):
#     arr = np.load(scaler_path, allow_pickle=True)
#     data_min, data_max = arr[0], arr[1]
#     # recreate MinMaxScaler behavior for inverse transform
#     class DummyScaler:
#         def __init__(self, data_min, data_max):
#             self.data_min_ = data_min
#             self.data_max_ = data_max
#             self.data_range_ = data_max - data_min

#         def inverse_transform(self, X):
#             return X * self.data_range_ + self.data_min_
#     return DummyScaler(data_min, data_max)

# # inference: predict future days using recursive forecasting
# def predict_future(symbol, days, lookback):
#     model_path = f"{MODEL_DIR}/{symbol}_lstm.h5"
#     scaler_path = f"{MODEL_DIR}/{symbol}_scaler.npy"

#     if not os.path.exists(model_path) or not os.path.exists(scaler_path):
#         raise FileNotFoundError("Model not trained. Set retrain=true to train before predicting.")

#     model = load_model(model_path)
#     scaler = load_scaler(scaler_path)

#     df = download_data(symbol, period="5y")
#     values = df.values
#     scaled_full = MinMaxScaler().fit_transform(values)  # NOTE: we don't have saved scaler instance's exact fit; we use saved min/max to invert
#     # For building the last window we will use the last `lookback` rows scaled using the same min/max
#     data_min = np.load(scaler_path, allow_pickle=True)[0]
#     data_max = np.load(scaler_path, allow_pickle=True)[1]
#     data_range = data_max - data_min
#     last_window = (values[-lookback:] - data_min) / data_range  # manual scale

#     preds_scaled = []
#     current_input = last_window.copy()  # shape (lookback, features)
#     for _ in range(days):
#         x = current_input.reshape(1, lookback, values.shape[1])
#         pred_scaled = model.predict(x, verbose=0)[0][0]
#         preds_scaled.append(pred_scaled)
#         # append predicted scaled close into next input
#         next_row = current_input[1:].copy()
#         # create next row: we approximate other features as last row; replace scaled close (index 3) with pred_scaled
#         new_row = current_input[-1].copy()
#         new_row[3] = pred_scaled
#         next_row = np.vstack([next_row, new_row])
#         current_input = next_row

#     # inverse transform predictions (build dummy arrays)
#     dummy = np.zeros((len(preds_scaled), values.shape[1]))
#     dummy[:, 3] = preds_scaled
#     preds_inv = scaler.inverse_transform(dummy)[:, 3]

#     # dates
#     last_date = df.index[-1]
#     future_dates = pd.bdate_range(last_date + timedelta(days=1), periods=days)
#     result = [{"date": str(d.date()), "predicted_price": float(p)} for d, p in zip(future_dates, preds_inv)]
#     return result

# @app.post("/predict")
# def predict(req: PredictRequest):
#     symbol = req.symbol.upper()
#     days = req.days
#     lookback = req.lookback
#     epochs = req.epochs
#     batch_size = req.batch_size
#     retrain = req.retrain

#     model_path = f"{MODEL_DIR}/{symbol}_lstm.h5"
#     scaler_path = f"{MODEL_DIR}/{symbol}_scaler.npy"

#     # train if requested or model not present
#     train_info = None
#     if retrain or not (os.path.exists(model_path) and os.path.exists(scaler_path)):
#         try:
#             train_info = train_and_save(symbol, lookback=lookback, epochs=epochs, batch_size=batch_size)
#         except Exception as e:
#             return {"error": "Training failed", "details": str(e)}

#     # inference
#     try:
#         preds = predict_future(symbol, days, lookback)
#     except Exception as e:
#         return {"error": "Prediction failed", "details": str(e)}

#     response = {"symbol": symbol, "predictions": preds}
#     if train_info:
#         response["train_info"] = train_info
#     return response

# @app.get("/")
# def root():
#     return {"message": "Improved Price Prediction Model API Running 🚀"}
import sys
import json
import numpy as np
from tensorflow.keras.models import load_model
import pickle

# Load Model and Scaler Once
model = load_model("models/AAPL_lstm.h5", compile=False)
with open("models/scaler.pkl", "rb") as f:
    scaler = pickle.load(f)

def predict_price(features):
    features = np.array(features)
    if features.shape != (60, 5):
        raise ValueError(f"Invalid input shape {features.shape}. Expected (60, 5)")
    
    scaled = scaler.transform(features)
    X_input = np.expand_dims(scaled, axis=0)
    prediction_scaled = model.predict(X_input)

    # inverse scaling
    dummy = np.zeros((1, 5))
    dummy[0, 3] = prediction_scaled
    predicted_price = scaler.inverse_transform(dummy)[0, 3]

    return float(predicted_price)

if __name__ == "__main__":
    input_data = json.loads(sys.argv[1])
    result = predict_price(input_data)
    print(result)
