from google import genai

# ✅ NEW CLIENT (correct way)
client = genai.Client(api_key="AQ.Ab8RN6I7TINvVWC2UHIw9dNJEe1hr3EW0ou0FahDj8_5rYVNCg")


def get_response(user_input):
    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents=user_input
    )
    return response.text