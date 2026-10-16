import os
import requests
from dotenv import load_dotenv

load_dotenv()
API_KEY= os.getenv("TMDB_API_KEY")

# Step A: search for the movie
search_response = requests.get(
    "https://api.themoviedb.org/3/search/movie",
    params={"api_key": API_KEY, "query": "Interstellar"}
)
movie = search_response.json()["results"][0]
movie_id = movie["id"]

print("Found:", movie["title"])

# Step B: get streaming providers for that movie
providers_response = requests.get(
    f"https://api.themoviedb.org/3/movie/{movie_id}/watch/providers",
    params={"api_key": API_KEY}
)
providers_data = providers_response.json()

# Step C: pull out just India's listing
results = providers_data["results"]
india_data = results.get("IN")

if india_data:
    print("Available in India on:")
    flatrate = india_data.get("flatrate", [])
    for platform in flatrate:
        print("-", platform["provider_name"])
else:
    print("No India listing found for this movie.")