import pandas as pd
from sklearn.linear_model import LinearRegression
import joblib

data = pd.read_csv("housing.csv")

X = data[["Area", "Bedrooms", "Bathrooms", "Parking"]]
y = data["Price"]

model = LinearRegression()
model.fit(X, y)

joblib.dump(model, "house_model.pkl")

print("Model trained successfully!")
print("house_model.pkl has been created.")