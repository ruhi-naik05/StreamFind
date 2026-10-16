import os
import requests
from dotenv import load_dotenv
from flask import Flask, request

load_dotenv()
API_KEY=os.getenv("TMDB_API_KEY")

app = Flask(__name__)

@app.route("/")
def home():
    return "StreamFind backend is running!"

@app.route("/search")
def search():
    title = request.args.get("title")
    response = requests.get(
        "https://api.themoviedb.org/3/search/movie",
        params={"api_key": API_KEY, "query": title},
    )
    data = response.json()
    movie = data["results"][0]

    providers_response = requests.get(
        f"https://api.themoviedb.org/3/movie/{movie['id']}/watch/providers",
        params={"api_key": API_KEY},
    )
    providers = providers_response.json()["results"].get("IN", {})
    names = [p["provider_name"] for p in providers.get("flatrate", [])]
    return {"title": movie["title"], "platforms": names}

if __name__ == "__main__":
    app.run(debug=True)
