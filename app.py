import os
import requests
from dotenv import load_dotenv
from flask import Flask, request

load_dotenv()
API_KEY=os.getenv("TMDB_API_KEY")

PRICES = {
    "Netflix": 199,
    "Netflix Standard with Ads": 149,
    "Amazon Prime Video": 299,
    "Amazon Prime Video with Ads": 299,
    "Apple TV Plus": 199,
    "Disney Plus": 149,
    "JioHotstar": 149,
    "Lionsgate Play": 129,
    "Zee5": 245,
    "Sony Liv": 149,
    "Discovery Plus": 99,
    "Mubi": 199,
    "MX Player": 132,
    "Tubi TV": 199,
    "Eros Now": 149,
    "Hungama Play": 242,
    "Crunchyroll": 199,
    "Hidive": 149,
    "Animax": 245,
    "Muse India": 149,
    "Netflix Kids": 149,
    "Crunchyroll Amazon Channel" : 199,
}

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
        timeout=10,
    )
    data = response.json()
    movie = data["results"][0]

    providers_response = requests.get(
        f"https://api.themoviedb.org/3/movie/{movie['id']}/watch/providers",
        params={"api_key": API_KEY},
        timeout=10,
    ) 
    providers = providers_response.json()["results"].get("IN", {})
    platforms = []
    for p in providers.get("flatrate", []):
        name = p["provider_name"]
        platforms.append({"name": name, "price": PRICES.get(name)})

    platforms.sort(key=lambda x: (x["price"] is None, x["price"] or 0))
    return {"title": movie["title"], "platforms": platforms}

if __name__ == "__main__":
    app.run(debug=True)
