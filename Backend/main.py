from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import url_analyzer

app = FastAPI(title="CyberPulse API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # your React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(url_analyzer.router, prefix="/url", tags=["URL Analyzer"])

@app.get("/")
def root():
    return {"status": "CyberPulse API running"}