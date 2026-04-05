from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import socket
import whois
import re
from datetime import datetime, timezone
from app_state import stats

router = APIRouter()

class UrlRequest(BaseModel):
    url: str

def clean_url(url: str) -> str:
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url

def extract_domain(url: str) -> str:
    url = clean_url(url)
    domain = re.sub(r"https?://", "", url)
    domain = domain.split("/")[0].split("?")[0]
    return domain

SUSPICIOUS_KEYWORDS = [
    "login", "verify", "secure", "account", "update", "banking",
    "paypal", "amazon", "microsoft", "apple", "phish", "confirm",
    "password", "credential", "signin", "wallet", "urgent"
]

SUSPICIOUS_TLDS = [".xyz", ".tk", ".ml", ".ga", ".cf", ".gq", ".top", ".click"]

def calculate_risk(domain: str, domain_age_days: int, indicators: list) -> int:
    score = 0
    
    # Suspicious keywords in domain
    for kw in SUSPICIOUS_KEYWORDS:
        if kw in domain.lower():
            score += 20
            break
    
    # Suspicious TLD
    for tld in SUSPICIOUS_TLDS:
        if domain.endswith(tld):
            score += 25
            break
    
    # Very new domain
    if domain_age_days != -1:
        if domain_age_days < 30:
            score += 30
        elif domain_age_days < 180:
            score += 15

    # Extra indicators
    score += len([i for i in indicators if i["severity"] == "critical"]) * 15
    score += len([i for i in indicators if i["severity"] == "warning"]) * 8

    return min(score, 100)

@router.post("/analyze")
async def analyze_url(req: UrlRequest):
    url = clean_url(req.url)
    domain = extract_domain(url)
    indicators = []
    domain_age_days = -1

    # Resolve IP
    try:
        ip = socket.gethostbyname(domain)
    except socket.gaierror:
        ip = "Unresolvable"
        indicators.append({
            "type": "DNS Resolution Failed",
            "value": "Domain could not be resolved — may not exist",
            "severity": "critical"
        })

    # WHOIS lookup
    registrar = "Unknown"
    created_at = "Unknown"
    country = "Unknown"
    try:
        w = whois.whois(domain)
        registrar = w.registrar or "Unknown"
        country = w.country or "Unknown"

        creation = w.creation_date
        if isinstance(creation, list):
            creation = creation[0]
        if creation:
            if creation.tzinfo is None:
                creation = creation.replace(tzinfo=timezone.utc)
            created_at = creation.strftime("%Y-%m-%d")
            domain_age_days = (datetime.now(timezone.utc) - creation).days

            if domain_age_days < 30:
                indicators.append({
                    "type": "Very New Domain",
                    "value": f"Registered only {domain_age_days} days ago",
                    "severity": "critical"
                })
            elif domain_age_days < 180:
                indicators.append({
                    "type": "New Domain",
                    "value": f"Registered {domain_age_days} days ago",
                    "severity": "warning"
                })
    except Exception:
        indicators.append({
            "type": "WHOIS Lookup Failed",
            "value": "Could not retrieve domain registration info",
            "severity": "warning"
        })

    # Suspicious keywords check
    for kw in SUSPICIOUS_KEYWORDS:
        if kw in domain.lower():
            indicators.append({
                "type": "Suspicious Keyword",
                "value": f"Domain contains '{kw}' — common in phishing domains",
                "severity": "critical"
            })
            break

    # Suspicious TLD check
    for tld in SUSPICIOUS_TLDS:
        if domain.endswith(tld):
            indicators.append({
                "type": "High-Risk TLD",
                "value": f"'{tld}' is commonly used in malicious domains",
                "severity": "warning"
            })
            break

    # IP available = good sign
    if ip != "Unresolvable":
        indicators.append({
            "type": "DNS Resolves",
            "value": f"Domain resolves to {ip}",
            "severity": "info"
        })

    risk_score = calculate_risk(domain, domain_age_days, indicators)

    if risk_score >= 60:
        risk_level = "dangerous"
        categories = ["Suspicious", "Potential Phishing"]
    elif risk_score >= 25:
        risk_level = "suspicious"
        categories = ["Suspicious", "Needs Review"]
    else:
        risk_level = "safe"
        categories = ["Safe", "Verified"]

    # Track in stats
    threat_count = 1 if risk_level != "safe" else 0
    stats.record_scan("url", risk_level, threat_count)

    return {
        "url": url,
        "domain": domain,
        "ip": ip,
        "country": country,
        "registrar": registrar,
        "createdAt": created_at,
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "indicators": indicators,
        "categories": categories
    }