import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from fuzzywuzzy import process

app = Flask(__name__)
CORS(app)

# Load your Kaggle CSV (make sure it’s in the same folder)
df = pd.read_csv("starbucks_drinks.csv")
drink_names = df['Beverage'].dropna().unique().tolist()

def search_drink(name):
    match_result = process.extractOne(name, drink_names)
    if not match_result:
        return None

    match_name, score = match_result
    if score >= 70:
        match_rows = df[df['Beverage'] == match_name]
        if not match_rows.empty:
            match = match_rows.iloc[0]
        return {
                    "name": str(match['Beverage']),
                    "category": str(match['Beverage_category']),
                    "calories": int(match.get('Calories')) if pd.notna(match.get('Calories')) else None,
                    "sugar": str(match.get('Sugars (g)')),
                    "caffeine": str(match.get('Caffeine (mg)')),
                    "fat": str(match.get('Total Fat (g)')),
                    "ingredients": str(match.get('Ingredients', 'N/A')),
                    "match_score": int(score)
                }

    return None


@app.route('/', methods=['GET'])
def home():
    return "Say it. Sip it! API is running.", 200

@app.route('/parse-order', methods=['POST'])
def parse_order():
    try:
        print("🔥 Received a request.")
        data = request.get_json()
        print("📦 Parsed JSON:", data)

        if not data or "transcript" not in data:
            print("⚠️ No transcript found in request.")
            return jsonify({"error": "Transcript is required"}), 400

        user_input = data.get("transcript")
        print("🎙️ Transcript received:", user_input)

        drink_data = search_drink(user_input)
        print("☕ Drink data result:", drink_data)

        if not drink_data:
            print("❌ No matching drink found.")
            return jsonify({"error": "Drink not found"}), 404

        print("✅ Returning structured drink info.")
        return jsonify({"drink": drink_data}), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        print("💥 EXCEPTION:", str(e))
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
