def predict_multi(symbol, days=7):
    import numpy as np
    import pandas as pd
    import os, joblib
    from tensorflow.keras.models import load_model

    BASE_PATH = os.path.dirname(os.path.abspath(__file__))
    DATA_PATH = os.path.join(BASE_PATH, "data")
    MODEL_PATH = os.path.join(BASE_PATH, "models")

    model_file = os.path.join(MODEL_PATH, f"{symbol}.keras")
    scaler_file = os.path.join(MODEL_PATH, f"{symbol}_scaler.pkl")
    data_file = os.path.join(DATA_PATH, f"{symbol}.csv")

    if not all(map(os.path.exists, [model_file, scaler_file, data_file])):
        raise FileNotFoundError("Model, scaler, or data file missing")

    # Load
    model = load_model(model_file)
    scaler = joblib.load(scaler_file)

    # Load latest data
    df = pd.read_csv(data_file, index_col=0)
    df["Close"] = pd.to_numeric(df["Close"], errors="coerce")
    df.dropna(inplace=True)

    prices = df["Close"].values.reshape(-1, 1)
    scaled_prices = scaler.transform(prices)

    lookback = 60
    input_seq = scaled_prices[-lookback:].reshape(1, lookback, 1)

    last_date = pd.to_datetime(df.index[-1])
    future_dates = pd.date_range(
        start=last_date + pd.Timedelta(days=1),
        periods=days,
        freq="D"
    )

    predictions = []

    for i in range(days):
        pred_scaled = model.predict(input_seq, verbose=0)
        pred_price = scaler.inverse_transform(pred_scaled)[0][0]

        predictions.append({
            "date": future_dates[i].strftime("%Y-%m-%d"),
            "price": float(pred_price)
        })

        # shift window
        input_seq = np.concatenate(
            (input_seq[:, 1:, :], pred_scaled.reshape(1, 1, 1)),
            axis=1
        )

    return predictions
