from backend.app.config import settings
from backend.app.utils.dates import calculate_days_overdue

def compute_fine_for_due_date(due_iso: str, returned_iso: str = None) -> float:
    """Calculates fine at Rs 2/day overdue."""
    days = calculate_days_overdue(due_iso, returned_iso)
    return round(float(days * settings.FINE_PER_DAY), 2)

def is_blocked_by_fines(total_unpaid_fines: float) -> tuple[bool, str]:
    """Checks whether unpaid fines exceed policy limit (Rs 50)."""
    if total_unpaid_fines > settings.MAX_UNPAID_FINE_BLOCK:
        return True, f"Member has unpaid overdue fines of ₹{total_unpaid_fines:.2f}, exceeding the ₹{settings.MAX_UNPAID_FINE_BLOCK:.2f} threshold. Checkout blocked."
    return False, ""
