from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import List
from pydantic import BaseModel
from app_state import stats
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


# ─── PYDANTIC MODELS FOR RESPONSES ────────────────────────────────────────────

class TimelineDataPoint(BaseModel):
    timestamp: str
    packets: int
    threats: int
    bytes: int


class ThreatDistribution(BaseModel):
    malware: int
    phishing: int
    suspicious: int
    safe: int


class Activity(BaseModel):
    id: str
    type: str
    status: str
    timestamp: str
    message: str


class Alert(BaseModel):
    id: str
    severity: str
    title: str
    timestamp: str
    details: str


class ServiceHealth(BaseModel):
    status: str
    uptime: float


class SystemHealth(BaseModel):
    pcap_engine: ServiceHealth
    api_latency: int
    service_uptime: float


class DashboardSummary(BaseModel):
    total_scans: int
    threats_detected: int
    risk_score: float
    avg_response_time: str
    last_update: str


# ─── ROOT ENDPOINT ────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "CyberPulse API running"}


# ─── LEGACY ENDPOINTS (kept for backward compatibility) ──────────────────────

@app.get("/stats")
def get_stats():
    """Get dashboard statistics: total scans and threats detected"""
    return stats.get_stats()

@app.get("/recent-activity")
def get_recent_activity():
    """Get recent scan activity (last 10 scans)"""
    return stats.recent_scans[:10]


# ─── NEW DASHBOARD API ENDPOINTS ──────────────────────────────────────────────

@app.get("/api/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary():
    """Get comprehensive dashboard summary with all key metrics"""
    total = stats.total_scans
    threats = stats.threats_detected
    
    # Calculate risk score: 0-100 based on threat ratio
    risk_score = min((threats / max(total, 1)) * 100, 100)
    
    return DashboardSummary(
        total_scans=total,
        threats_detected=threats,
        risk_score=round(risk_score, 1),
        avg_response_time="245ms",  # Simulated - can be enhanced with timing tracking
        last_update=datetime.now().isoformat()
    )


@app.get("/api/dashboard/timeline", response_model=List[TimelineDataPoint])
def get_dashboard_timeline():
    """Get hourly timeline data for traffic chart over last 12 hours"""
    now = datetime.now()
    timeline_data = []
    
    # Generate 12 hours of timeline data
    for i in range(12, -1, -1):
        hour_start = now - timedelta(hours=i)
        hour_end = now - timedelta(hours=i-1)
        
        # Count scans and threats in this hour
        hour_scans = [s for s in stats.recent_scans 
                     if datetime.fromisoformat(s.timestamp) >= hour_start 
                     and datetime.fromisoformat(s.timestamp) < hour_end]
        
        packets = len(hour_scans) * (100 + (i % 50))  # Simulated packet count
        threats = sum(s.threat_count for s in hour_scans)
        
        timeline_data.append(TimelineDataPoint(
            timestamp=hour_start.isoformat(),
            packets=packets,
            threats=threats,
            bytes=packets * 1024  # Simulated byte count
        ))
    
    return timeline_data


@app.get("/api/dashboard/threat-distribution", response_model=ThreatDistribution)
def get_threat_distribution():
    """Get breakdown of threat types"""
    malware = 0
    phishing = 0
    suspicious = 0
    safe = 0
    
    # Analyze recent scans to categorize threats
    for scan in stats.recent_scans:
        scan_type = scan.type.lower()
        result = scan.result.lower()
        
        if result in ["dangerous", "malicious"]:
            malware += scan.threat_count
        elif scan_type in ["email", "url"] and "phish" in result:
            phishing += scan.threat_count
        elif result == "suspicious":
            suspicious += scan.threat_count
        else:
            safe += 1
    
    # Ensure we have data to display
    if malware + phishing + suspicious + safe == 0:
        safe = 1
    
    return ThreatDistribution(
        malware=malware,
        phishing=phishing,
        suspicious=suspicious,
        safe=max(safe, stats.total_scans - (malware + phishing + suspicious))
    )


@app.get("/api/dashboard/alerts", response_model=List[Alert])
def get_alerts():
    """Get active security alerts"""
    alerts: List[Alert] = []
    
    # Generate alerts from recent scans with threats
    for i, scan in enumerate(stats.recent_scans[:6]):
        if scan.threat_count > 0 or scan.result.lower() in ["dangerous", "suspicious"]:
            severity = "critical" if scan.threat_count > 2 else "high" if scan.threat_count > 0 else "medium"
            
            alerts.append(Alert(
                id=f"alert-{i}",
                severity=severity,
                title=f"{scan.type.upper()} - {scan.result}",
                timestamp=scan.timestamp,
                details=f"Detected {scan.threat_count} threat(s) in {scan.type} analysis"
            ))
    
    return alerts


@app.get("/api/system/health", response_model=SystemHealth)
def get_system_health():
    """Get system health metrics"""
    return SystemHealth(
        pcap_engine=ServiceHealth(status="healthy", uptime=99.95),
        api_latency=245,  # milliseconds
        service_uptime=99.95  # percentage
    )
