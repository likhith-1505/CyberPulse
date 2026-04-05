from fastapi import APIRouter, UploadFile, File, HTTPException
from scapy.all import rdpcap, IP, TCP, UDP, ICMP, DNS, Raw
from scapy.layers.http import HTTP, HTTPRequest, HTTPResponse
from collections import defaultdict
import tempfile
import os
import time

router = APIRouter()

# ── Helpers ──────────────────────────────────────────────

def get_protocol(packet) -> str:
    if packet.haslayer(DNS):
        return "DNS"
    if packet.haslayer(HTTPRequest) or packet.haslayer(HTTPResponse):
        return "HTTP"
    if packet.haslayer(TCP):
        return "TCP"
    if packet.haslayer(UDP):
        return "UDP"
    if packet.haslayer(ICMP):
        return "ICMP"
    return "Other"

def detect_port_scan(packets) -> list:
    alerts = []
    # track unique ports contacted per source IP
    src_ports = defaultdict(set)

    for pkt in packets:
        if pkt.haslayer(TCP) and pkt.haslayer(IP):
            src = pkt[IP].src
            dst_port = pkt[TCP].dport
            src_ports[src].add(dst_port)

    for src, ports in src_ports.items():
        if len(ports) > 15:
            alerts.append({
                "severity": "high",
                "message": f"Port scan detected from {src}",
                "src": src,
                "dst": "multiple",
                "detail": f"Contacted {len(ports)} unique ports"
            })
    return alerts

def detect_syn_flood(packets) -> list:
    alerts = []
    syn_counts = defaultdict(int)

    for pkt in packets:
        if pkt.haslayer(TCP) and pkt.haslayer(IP):
            # SYN flag set, ACK not set
            if pkt[TCP].flags == 0x02:
                dst = pkt[IP].dst
                syn_counts[dst] += 1

    for dst, count in syn_counts.items():
        if count > 100:
            alerts.append({
                "severity": "high",
                "message": f"SYN flood attempt detected targeting {dst}",
                "src": "multiple",
                "dst": dst,
                "detail": f"{count} SYN packets with no ACK"
            })
    return alerts

def detect_dns_anomalies(packets) -> list:
    alerts = []
    dns_counts = defaultdict(int)

    for pkt in packets:
        if pkt.haslayer(DNS) and pkt.haslayer(IP):
            src = pkt[IP].src
            dns_counts[src] += 1

    for src, count in dns_counts.items():
        if count > 50:
            alerts.append({
                "severity": "medium",
                "message": f"Unusual DNS query volume from {src}",
                "src": src,
                "dst": "DNS servers",
                "detail": f"{count} DNS queries — possible DNS tunneling"
            })
    return alerts

def detect_cleartext_creds(packets) -> list:
    alerts = []
    keywords = [b"password=", b"passwd=", b"pwd=",
                b"user=", b"username=", b"login="]

    for pkt in packets:
        if pkt.haslayer(Raw) and pkt.haslayer(IP):
            payload = bytes(pkt[Raw].load).lower()
            for kw in keywords:
                if kw in payload:
                    src = pkt[IP].src
                    dst = pkt[IP].dst
                    alerts.append({
                        "severity": "high",
                        "message": "Cleartext credentials detected in traffic",
                        "src": src,
                        "dst": dst,
                        "detail": f"Keyword '{kw.decode()}' found in raw payload"
                    })
                    break
    return alerts

def detect_large_transfers(packets) -> list:
    alerts = []
    transfer_sizes = defaultdict(int)

    for pkt in packets:
        if pkt.haslayer(IP):
            pair = f"{pkt[IP].src} → {pkt[IP].dst}"
            transfer_sizes[pair] += len(pkt)

    for pair, size in transfer_sizes.items():
        # flag transfers over 10MB
        if size > 10 * 1024 * 1024:
            mb = round(size / (1024 * 1024), 1)
            alerts.append({
                "severity": "medium",
                "message": f"Large data transfer detected: {pair}",
                "src": pair.split(" → ")[0],
                "dst": pair.split(" → ")[1],
                "detail": f"{mb} MB transferred — possible exfiltration"
            })
    return alerts

def build_timeline(packets) -> list:
    if not packets:
        return []

    start_time = float(packets[0].time)
    # split capture into 12 equal intervals
    end_time = float(packets[-1].time)
    duration = max(end_time - start_time, 1)
    interval = duration / 12

    buckets = defaultdict(int)
    for pkt in packets:
        t = float(pkt.time) - start_time
        bucket = int(t / interval)
        bucket = min(bucket, 11)
        buckets[bucket] += len(pkt)

    timeline = []
    for i in range(12):
        seconds = round(i * interval)
        timeline.append({
            "time": f"{seconds}s",
            "bytes": buckets.get(i, 0)
        })
    return timeline

def get_top_talkers(packets, limit=5) -> list:
    traffic = defaultdict(int)
    for pkt in packets:
        if pkt.haslayer(IP):
            traffic[pkt[IP].src] += len(pkt)

    sorted_talkers = sorted(
        traffic.items(),
        key=lambda x: x[1],
        reverse=True
    )[:limit]

    return [
        {"ip": ip, "bytes": bytes_sent,
         "mb": round(bytes_sent / (1024 * 1024), 2)}
        for ip, bytes_sent in sorted_talkers
    ]

# ── Main endpoint ─────────────────────────────────────────

@router.post("/upload")
async def analyze_pcap(file: UploadFile = File(...)):
    # Validate file type
    if not file.filename.endswith((".pcap", ".pcapng", ".cap")):
        raise HTTPException(
            status_code=400,
            detail="Only .pcap, .pcapng and .cap files are supported"
        )

    # Save to temp file — scapy needs a real file path
    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".pcap"
    ) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Parse packets with scapy
        packets = rdpcap(tmp_path)
    except Exception as e:
        os.unlink(tmp_path)
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse PCAP file: {str(e)}"
        )
    finally:
        os.unlink(tmp_path)

    if len(packets) == 0:
        raise HTTPException(
            status_code=400,
            detail="PCAP file is empty"
        )

    # Basic stats
    total_packets = len(packets)
    start_time    = float(packets[0].time)
    end_time      = float(packets[-1].time)
    duration_secs = round(end_time - start_time, 1)

    # Format duration nicely
    mins = int(duration_secs // 60)
    secs = int(duration_secs % 60)
    duration_str = f"{mins}m {secs}s" if mins > 0 else f"{secs}s"

    # Protocol breakdown
    protocols = defaultdict(int)
    for pkt in packets:
        proto = get_protocol(pkt)
        protocols[proto] += 1

    # Run all detection modules
    alerts = []
    alerts += detect_port_scan(packets)
    alerts += detect_syn_flood(packets)
    alerts += detect_dns_anomalies(packets)
    alerts += detect_cleartext_creds(packets)
    alerts += detect_large_transfers(packets)

    # Sort alerts — high severity first
    severity_order = {"high": 0, "medium": 1, "low": 2}
    alerts.sort(key=lambda x: severity_order.get(x["severity"], 3))

    return {
        "totalPackets":   total_packets,
        "duration":       duration_str,
        "protocols":      dict(protocols),
        "alerts":         alerts,
        "trafficTimeline": build_timeline(packets),
        "topTalkers":     get_top_talkers(packets),
        "alertCount": {
            "high":   len([a for a in alerts if a["severity"] == "high"]),
            "medium": len([a for a in alerts if a["severity"] == "medium"]),
            "low":    len([a for a in alerts if a["severity"] == "low"])
        }
    }