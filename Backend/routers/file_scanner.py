from fastapi import APIRouter, UploadFile, File, HTTPException
import httpx
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path
from app_state import stats as global_stats

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

router = APIRouter()

VT_BASE_URL = "https://www.virustotal.com/api/v3"

@router.post("/scan")
async def scan_file(file: UploadFile = File(...)):
    
    # Load key fresh inside function — guarantees it's loaded
    VT_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")
    
    print(f"[DEBUG] Key loaded: {VT_API_KEY[:8] if VT_API_KEY else 'NOT FOUND'}")

    if not VT_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="VirusTotal API key not configured"
        )

    HEADERS = {"x-apikey": VT_API_KEY}

    # Read file content
    content = await file.read()
    file_size_kb = round(len(content) / 1024, 1)

    # Step 1 — Upload file to VirusTotal
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            upload_response = await client.post(
                f"{VT_BASE_URL}/files",
                headers=HEADERS,
                files={"file": (file.filename, content, file.content_type)}
            )

            if upload_response.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail=f"VirusTotal upload failed: {upload_response.text}"
                )

            upload_data = upload_response.json()
            analysis_id = upload_data["data"]["id"]

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="VirusTotal upload timed out")

    # Step 2 — Poll for results
    async with httpx.AsyncClient(timeout=30) as client:
        for attempt in range(10):
            await asyncio.sleep(3)

            result_response = await client.get(
                f"{VT_BASE_URL}/analyses/{analysis_id}",
                headers=HEADERS
            )

            result_data = result_response.json()
            status = result_data["data"]["attributes"]["status"]

            if status == "completed":
                break
        else:
            raise HTTPException(
                status_code=504,
                detail="VirusTotal analysis timed out — try again"
            )

    # Step 3 — Parse results
    attributes = result_data["data"]["attributes"]
    vt_stats = attributes["stats"]
    results = attributes["results"]

    detected = vt_stats.get("malicious", 0) + vt_stats.get("suspicious", 0)
    total = sum(vt_stats.values())

    # Build per-engine results
    engines = []
    for engine_name, engine_data in results.items():
        category = engine_data.get("category", "undetected")
        is_detected = category in ("malicious", "suspicious")
        engines.append({
            "name": engine_name,
            "detected": is_detected,
            "result": engine_data.get("result") if is_detected else None
        })

    # Sort — detected first
    engines.sort(key=lambda x: x["detected"], reverse=True)

    # Risk level
    if detected == 0:
        risk_level = "clean"
    elif detected <= 3:
        risk_level = "suspicious"
    else:
        risk_level = "dangerous"

    sha256 = attributes.get("sha256", "Unknown")

    # Track in stats
    threat_count = 1 if risk_level != "clean" else 0
    global_stats.record_scan("file", risk_level, threat_count)

    return {
        "fileName": file.filename,
        "fileSize": f"{file_size_kb} KB",
        "sha256": sha256,
        "detectionRatio": {
            "detected": detected,
            "total": total
        },
        "engines": engines[:20],
        "firstSeen": "Unknown",
        "riskLevel": risk_level
    }