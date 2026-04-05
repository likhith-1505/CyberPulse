from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import url_analyzer
from routers import file_scanner  
from routers import email_analyzer       
from routers import pcap_analyzer   



app = FastAPI(title="CyberPulse API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(url_analyzer.router, prefix="/url", tags=["URL Analyzer"])
app.include_router(file_scanner.router, prefix="/file", tags=["File Scanner"]) 
app.include_router(email_analyzer.router,prefix="/email", tags=["Email Analyzer"])  
app.include_router(pcap_analyzer.router,  prefix="/pcap",  tags=["PCAP Analyzer"])  




@app.get("/")
def root():
    return {"status": "CyberPulse API running"}