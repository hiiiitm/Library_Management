from datetime import datetime, timezone, timedelta

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def now_iso() -> str:
    return now_utc().strftime("%Y-%m-%dT%H:%M:%SZ")

def parse_iso(iso_str: str) -> datetime:
    if not iso_str:
        return now_utc()
    # Handle varying trailing Z or offsets
    cleaned = iso_str.replace("Z", "+00:00")
    dt = datetime.fromisoformat(cleaned)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt

def add_days(base_dt: datetime, days: int) -> datetime:
    return base_dt + timedelta(days=days)

def calculate_days_overdue(due_iso: str, target_iso: str = None) -> int:
    due_dt = parse_iso(due_iso)
    target_dt = parse_iso(target_iso) if target_iso else now_utc()
    diff = (target_dt - due_dt).total_seconds()
    if diff <= 0:
        return 0
    return int(diff // 86400)
