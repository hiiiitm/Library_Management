import random
import string

def generate_book_id(existing_ids: list[str]) -> str:
    nums = [int(x[1:]) for x in existing_ids if x.startswith("B") and x[1:].isdigit()]
    next_num = (max(nums) + 1) if nums else 1
    return f"B{next_num:04d}"

def generate_loan_id(existing_ids: list[str]) -> str:
    nums = [int(x[1:]) for x in existing_ids if x.startswith("L") and x[1:].isdigit()]
    next_num = (max(nums) + 1) if nums else 1
    return f"L{next_num:05d}"

def generate_member_id(existing_ids: list[str]) -> str:
    nums = [int(x[1:]) for x in existing_ids if x.startswith("M") and x[1:].isdigit()]
    next_num = (max(nums) + 1) if nums else 1
    return f"M{next_num:04d}"

def generate_author_id(existing_ids: list[str]) -> str:
    nums = [int(x[1:]) for x in existing_ids if x.startswith("A") and x[1:].isdigit()]
    next_num = (max(nums) + 1) if nums else 1
    return f"A{next_num:04d}"

def generate_reservation_id(existing_ids: list[str]) -> str:
    nums = [int(x[1:]) for x in existing_ids if x.startswith("R") and x[1:].isdigit()]
    next_num = (max(nums) + 1) if nums else 1
    return f"R{next_num:04d}"

def generate_review_id(existing_ids: list[str]) -> str:
    nums = [int(x[3:]) for x in existing_ids if x.startswith("REV") and x[3:].isdigit()]
    next_num = (max(nums) + 1) if nums else 1
    return f"REV{next_num:04d}"
