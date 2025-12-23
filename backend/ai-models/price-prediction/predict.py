def predict_multi(symbol, days=7):
    import numpy as np
    import pandas as pd
    import os
    from tensorflow.keras.models import load_model
    from sklearn.preprocessing import MinMaxScaler

    BASE_PATH = os.path.dirname(os.path.abspath(__file__))
    DATA_PATH = os.path.join(BASE_PATH, "data")
    MODEL_PATH = os.path.join(BASE_PATH, "models")

    model_file = os.path.join(MODEL_PATH, f"{symbol}.keras")
    data_file = os.path.join(DATA_PATH, f"{symbol}.csv")

    if not os.path.exists(model_file):
        raise FileNotFoundError(f"Model file not found: {model_file}")
    if not os.path.exists(data_file):
        raise FileNotFoundError(f"Data file not found: {data_file}")

    df = pd.read_csv(data_file, index_col=0)
    df["Close"] = pd.to_numeric(df["Close"], errors="coerce")
    df.dropna(inplace=True)

    prices = df['Close'].values.reshape(-1, 1)
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_prices = scaler.fit_transform(prices)

    last_60 = scaled_prices[-60:]  # last 60 days
    input_seq = np.expand_dims(last_60, axis=0)  # shape (1, 60, 1)

    model = load_model(model_file)
    last_date = pd.to_datetime(df.index[-1])

    future_dates = pd.date_range(
        start=last_date + pd.Timedelta(days=1),
        periods=15,
        freq="D"
    )

    predictions = []

    for i in range(15):
        pred_scaled = model.predict(input_seq, verbose=0)
        pred_price = scaler.inverse_transform(pred_scaled)[0][0]
        predictions.append({
            "date": future_dates[i].strftime("%Y-%m-%d"),
            "price": float(pred_price)
        })
        input_seq = np.concatenate(
        (input_seq[:, 1:, :], pred_scaled.reshape(1, 1, 1)),
        axis=1
        )
    return predictions


