from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
import core.config  # ensures runtime environment check happens on boot

app = FastAPI(title="RadeonShift AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)