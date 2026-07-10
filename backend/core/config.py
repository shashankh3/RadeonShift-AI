import os

FIREWORKS_API_KEY = os.environ.get("FIREWORKS_API_KEY")

if not FIREWORKS_API_KEY:
    raise RuntimeError("FIREWORKS_API_KEY environment variable is not set. See .env.example")
