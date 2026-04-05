from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import re
import socket
from email import message_from_string
from email.header import decode_header
from app_state import stats as global_stats

router = APIRouter()

class EmailRequest(BaseModel):
    headers: str

# ── Helpers ──────────────────────────────────────────────

def extract_ips(text: str) -> list:
    pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
    ips = re.findall(pattern, text)
    # filter out private/localhost IPs
    public = []
    for ip in ips:
        parts = ip.split(".")
        if parts[0] in ("10", "127", "169", "172", "192"):
            continue
        public.append(ip)
    return list(set(public))

def parse_auth_results(headers_text: str) -> dict:
    text = headers_text.lower()

    def get_status(protocol: str) -> str:
        pattern = rf'{protocol}=(\w+)'
        match = re.search(pattern, text)
        if match:
            result = match.group(1)
            if result in ("pass", "fail", "neutral", "none",
                         "softfail", "temperror", "permerror"):
                return result
        return "none"

    return {
        "spf":   get_status("spf"),
        "dkim":  get_status("dkim"),
        "dmarc": get_status("dmarc")
    }

def extract_hops(headers_text: str) -> list:
    hops = []
    # find all Received: headers
    received_pattern = re.findall(
        r'Received:\s*from\s+(.+?)\s+by\s+(.+?)(?:\s+with\s+\S+)?\s*;(.+?)(?=Received:|$)',
        headers_text,
        re.DOTALL | re.IGNORECASE
    )
    for match in received_pattern:
        from_host = match[0].strip().replace("\n", " ")
        by_host   = match[1].strip().replace("\n", " ")
        time_str  = match[2].strip().replace("\n", " ")
        hops.append({
            "from": from_host[:80],
            "by":   by_host[:80],
            "time": time_str[:50]
        })
    return hops

def check_spoofing(from_addr: str, reply_to: str,
                   auth: dict, warnings: list) -> str:
    risk_score = 0

    if auth["spf"] in ("fail", "softfail", "permerror"):
        risk_score += 35
    if auth["dkim"] == "fail":
        risk_score += 35
    if auth["dmarc"] == "fail":
        risk_score += 20

    # reply-to mismatch
    if reply_to and from_addr:
        from_domain   = from_addr.split("@")[-1].strip(">").lower()
        reply_domain  = reply_to.split("@")[-1].strip(">").lower()
        if from_domain and reply_domain and from_domain != reply_domain:
            risk_score += 20
            warnings.append(
                "Reply-To domain differs from From domain — "
                "common in phishing emails"
            )

    if risk_score >= 60:
        return "high"
    elif risk_score >= 30:
        return "medium"
    return "low"

def lookup_ip_info(ip: str) -> dict:
    try:
        hostname = socket.gethostbyaddr(ip)[0]
    except Exception:
        hostname = "Unknown"
    return {"ip": ip, "hostname": hostname}

# ── Main endpoint ─────────────────────────────────────────

@router.post("/analyze")
async def analyze_email(req: EmailRequest):
    if not req.headers.strip():
        raise HTTPException(
            status_code=400,
            detail="No headers provided"
        )

    headers_text = req.headers
    warnings     = []

    # Parse with Python's email library
    msg = message_from_string(headers_text)

    # Extract basic fields
    from_addr  = msg.get("From", "Unknown")
    reply_to   = msg.get("Reply-To", "")
    subject    = msg.get("Subject", "Unknown")
    message_id = msg.get("Message-ID", "Unknown")
    date       = msg.get("Date", "Unknown")

    # Extract IPs from headers
    ips = extract_ips(headers_text)
    sender_ip = ips[0] if ips else "Unknown"

    # Reverse lookup
    ip_info = lookup_ip_info(sender_ip) if sender_ip != "Unknown" else {}

    # Authentication results
    auth = parse_auth_results(headers_text)

    # Build warnings based on auth
    if auth["spf"] in ("fail", "softfail"):
        warnings.append(
            "SPF record does not authorize the sending IP"
        )
    if auth["dkim"] == "fail":
        warnings.append(
            "DKIM signature validation failed — "
            "message may have been tampered with"
        )
    if auth["dmarc"] == "fail":
        warnings.append(
            "DMARC policy check failed — "
            "domain owner has flagged this as suspicious"
        )
    if auth["spf"] == "none":
        warnings.append(
            "No SPF record found for sending domain"
        )

    # Check for suspicious subject keywords
    suspicious_subjects = [
        "urgent", "verify", "suspended", "confirm",
        "password", "account", "winner", "prize",
        "click here", "act now", "limited time"
    ]
    if any(kw in subject.lower() for kw in suspicious_subjects):
        warnings.append(
            f"Subject contains urgent/suspicious language: '{subject}'"
        )

    # Extract routing hops
    hops = extract_hops(headers_text)

    # Calculate spoofing risk
    spoofing_risk = check_spoofing(from_addr, reply_to, auth, warnings)

    # Track in stats (consider high spoofing risk as a threat)
    threat_count = 1 if spoofing_risk == "high" or len(warnings) > 2 else 0
    global_stats.record_scan("email", spoofing_risk, threat_count)

    return {
        "senderIp":     sender_ip,
        "ipInfo":       ip_info,
        "fromAddress":  from_addr,
        "replyTo":      reply_to,
        "subject":      subject,
        "messageId":    message_id,
        "date":         date,
        "spf":          auth["spf"],
        "dkim":         auth["dkim"],
        "dmarc":        auth["dmarc"],
        "spoofingRisk": spoofing_risk,
        "hops":         hops,
        "extractedIps": ips,
        "warnings":     warnings
    }