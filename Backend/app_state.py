"""Global application state and statistics tracking"""

from pydantic import BaseModel
from datetime import datetime
from typing import List


class ScanEntry(BaseModel):
    type: str  # "url", "file", "email", "pcap"
    timestamp: str
    result: str  # "safe", "suspicious", "dangerous", or summary
    threat_count: int = 0


class Stats:
    def __init__(self):
        self.total_scans = 0
        self.threats_detected = 0
        self.recent_scans: List[ScanEntry] = []
    
    def record_scan(self, scan_type: str, result: str, threat_count: int = 0):
        self.total_scans += 1
        self.threats_detected += threat_count
        entry = ScanEntry(
            type=scan_type,
            timestamp=datetime.now().isoformat(),
            result=result,
            threat_count=threat_count
        )
        # Keep last 20 scans
        self.recent_scans.insert(0, entry)
        if len(self.recent_scans) > 20:
            self.recent_scans.pop()
    
    def get_stats(self):
        return {
            "total_scans": self.total_scans,
            "threats_detected": self.threats_detected
        }


# Global stats instance
stats = Stats()
