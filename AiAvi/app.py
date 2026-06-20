import os
from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Load ML model
model = joblib.load("house_model.pkl")

# ✅ Correct way (use variable name, NOT key)
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = pd.DataFrame({
            "Area":      [float(request.form["area"])],
            "Bedrooms":  [int(request.form["bedrooms"])],
            "Bathrooms": [int(request.form["bathrooms"])],
            "Parking":   [int(request.form["parking"])]
        })

        prediction = model.predict(data)[0]

        return jsonify({
            "result": f"₹{prediction:,.0f}"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/chat", methods=["POST"])
def chat():
    try:
        user_message = request.json.get("message")

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful real estate assistant for the Indian housing market."
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ]
        )

        return jsonify({
            "reply": response.choices[0].message.content
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)