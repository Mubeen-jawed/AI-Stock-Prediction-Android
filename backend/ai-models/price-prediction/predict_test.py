from predict import predict_multi

pred_7_days = predict_multi("AAPL", days=7)
print("Next 7-day forecast:", pred_7_days)