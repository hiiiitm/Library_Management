"""
Deterministic Dataset Generator for Library Management System
Random Seed: 42
Generates:
- 220 Books (enriched with real metadata, genre links, ratings)
- ~130 Authors (with bio, nationality, birth_year)
- 150 Members (Indian context with Faker en_IN, 3 librarians, realistic genre preferences)
- ~1,400 Loans over the past 12 months (~80% returned, ~12% active, ~8% overdue with fines)
- ~40 Reservations
- ~450 Reviews (1-5 stars from members who read the book)
Validates referential integrity and saves to data/raw/*.json.
"""

import json
import os
import random
from datetime import datetime, timedelta, timezone
from faker import Faker

from data.seed_books import get_seed_books

# Fixed random seed for 100% reproducibility
SEED = 42
random.seed(SEED)
fake = Faker("en_IN")
fake.seed_instance(SEED)

BASE_DATE = datetime(2026, 10, 30, 12, 0, 0, tzinfo=timezone.utc)

AUTHOR_META = {
    "Robert C. Martin": {"nationality": "American", "birth_year": 1952, "bio": "Software engineer and author of Clean Code and Clean Architecture."},
    "Erich Gamma": {"nationality": "Swiss", "birth_year": 1961, "bio": "Computer scientist, co-author of Design Patterns and Eclipse / VS Code architect."},
    "Martin Fowler": {"nationality": "British", "birth_year": 1963, "bio": "Chief Scientist at ThoughtWorks, author on refactoring and software architecture."},
    "Martin Kleppmann": {"nationality": "German", "birth_year": 1984, "bio": "Researcher in distributed systems and local-first software at Cambridge."},
    "Arundhati Roy": {"nationality": "Indian", "birth_year": 1961, "bio": "Novelist, political activist, and winner of the 1997 Man Booker Prize."},
    "Salman Rushdie": {"nationality": "British-Indian", "birth_year": 1947, "bio": "Celebrated novelist master of magical realism and Booker of Bookers winner."},
    "Amish Tripathi": {"nationality": "Indian", "birth_year": 1974, "bio": "Best-selling Indian author renowned for mythological fiction epics."},
    "Chitra Banerjee Divakaruni": {"nationality": "Indian-American", "birth_year": 1956, "bio": "Author and poet renowned for feminist retellings of Indian epics."},
    "R.K. Narayan": {"nationality": "Indian", "birth_year": 1906, "bio": "Leading figure of early Indian literature in English set in Malgudi."},
    "A.P.J. Abdul Kalam": {"nationality": "Indian", "birth_year": 1931, "bio": "Aerospace scientist and 11th President of India, known as the Missile Man."},
    "Shashi Tharoor": {"nationality": "Indian", "birth_year": 1956, "bio": "Prolific author, diplomat, and parliamentarian."},
    "George Orwell": {"nationality": "British", "birth_year": 1903, "bio": "Novelist, essayist, and critic known for 1984 and Animal Farm."},
    "Jane Austen": {"nationality": "British", "birth_year": 1775, "bio": "Novelist known for her incisive romantic social commentary in Regency England."},
    "J.R.R. Tolkien": {"nationality": "British", "birth_year": 1892, "bio": "Philologist, academic, and author of The Hobbit and The Lord of the Rings."},
    "Frank Herbert": {"nationality": "American", "birth_year": 1920, "bio": "Science fiction writer best known for his magnum opus Dune."},
    "Isaac Asimov": {"nationality": "American", "birth_year": 1920, "bio": "Prolific writer and biochemist, creator of the Foundation and Robot series."},
    "Agatha Christie": {"nationality": "British", "birth_year": 1890, "bio": "The Queen of Mystery and bestselling fiction writer in history."},
    "Arthur Conan Doyle": {"nationality": "British", "birth_year": 1859, "bio": "Physician and creator of the master consulting detective Sherlock Holmes."},
    "Marcus Aurelius": {"nationality": "Roman", "birth_year": 121, "bio": "Roman emperor and prominent Stoic philosopher."},
    "Yuval Noah Harari": {"nationality": "Israeli", "birth_year": 1976, "bio": "Historian, philosopher, and bestselling author of Sapiens."},
    "Stephen Hawking": {"nationality": "British", "birth_year": 1942, "bio": "Theoretical physicist, cosmologist, and author of A Brief History of Time."},
    "Carl Sagan": {"nationality": "American", "birth_year": 1934, "bio": "Astronomer, planetary scientist, and science communicator of Cosmos fame."},
    "Walter Isaacson": {"nationality": "American", "birth_year": 1952, "bio": "Biographer of Steve Jobs, Albert Einstein, and Leonardo da Vinci."},
    "James Clear": {"nationality": "American", "birth_year": 1986, "bio": "Author and speaker on habits, decision making, and continuous improvement."},
    "J.K. Rowling": {"nationality": "British", "birth_year": 1965, "bio": "Creator of the beloved global Harry Potter fantasy universe."},
    "Alan Moore": {"nationality": "British", "birth_year": 1953, "bio": "Visionary graphic novelist of Watchmen, V for Vendetta, and From Hell."}
}

REVIEW_COMMENTS = [
    "An absolute masterpiece of its genre. Every page offered brilliant insight.",
    "Engaging narrative with profound depth. Recommended without hesitation.",
    "Exceptional storytelling and meticulous research. Hard to put down.",
    "Very informative and thought-provoking, though somewhat dense in the middle chapters.",
    "A timeless classic that completely altered my perspective on the subject.",
    "Great concepts, though the writing style felt slightly dated in parts.",
    "Compelling characters and masterclass world-building.",
    "Practical, actionable advice that I immediately began applying in daily life.",
    "Lyrical prose and unforgettable themes. A must-read for any serious book lover.",
    "Solid read, well-paced, and left me eager to explore more by this author."
]

def generate_dataset():
    books, author_id_map = get_seed_books()
    all_genres = sorted(list(set(g for b in books for g in b["genres"])))
    
    # 1. Build Authors List
    authors = []
    for author_name, author_id in author_id_map.items():
        meta = AUTHOR_META.get(author_name, {
            "nationality": "International",
            "birth_year": random.randint(1920, 1985),
            "bio": f"Distinguished author with prominent contributions to literature and knowledge."
        })
        authors.append({
            "author_id": author_id,
            "name": author_name,
            "bio": meta["bio"],
            "nationality": meta["nationality"],
            "birth_year": meta["birth_year"]
        })
        
    # 2. Build 150 Members (3 librarians, 147 members)
    members = []
    librarians_data = [
        ("M0001", "Dr. Rajeshwar Sharma", "rajeshwar.sharma@example.com", "+91 98110 23411", "faculty"),
        ("M0002", "Sunita Nair", "sunita.nair@example.com", "+91 98220 54122", "standard"),
        ("M0003", "Aakash Banerjee", "aakash.banerjee@example.com", "+91 98330 87233", "premium")
    ]
    
    for mid, name, email, phone, mtype in librarians_data:
        fav_genres = random.sample(all_genres, k=random.randint(2, 3))
        joined = BASE_DATE - timedelta(days=random.randint(400, 700))
        members.append({
            "member_id": mid,
            "name": name,
            "email": email,
            "phone": phone,
            "role": "librarian",
            "membership_type": mtype,
            "status": "active",
            "max_loans": 10,
            "favorite_genres": fav_genres,
            "joined_at": joined.strftime("%Y-%m-%dT%H:%M:%SZ")
        })
        
    for i in range(4, 151):
        mid = f"M{i:04d}"
        name = fake.name()
        email = f"{name.lower().replace(' ', '.').replace('dr.', '').replace('mr.', '').replace('ms.', '').strip('.')}@example.com"
        phone = f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}"
        mtype = random.choices(["student", "standard", "faculty", "premium"], weights=[0.45, 0.35, 0.10, 0.10])[0]
        max_loans = 5 if mtype in ["student", "standard"] else 8
        fav_genres = random.sample(all_genres, k=random.randint(1, 3))
        joined = BASE_DATE - timedelta(days=random.randint(30, 600))
        members.append({
            "member_id": mid,
            "name": name,
            "email": email,
            "phone": phone,
            "role": "member",
            "membership_type": mtype,
            "status": "active" if random.random() > 0.05 else "suspended",
            "max_loans": max_loans,
            "favorite_genres": fav_genres,
            "joined_at": joined.strftime("%Y-%m-%dT%H:%M:%SZ")
        })

    # 3. Build ~1,400 Loans
    # Assign popularity weights to books (Zipf-like distribution)
    # The first 30 books are hot/bestsellers, next 70 medium, rest long-tail
    book_weights = []
    for idx, b in enumerate(books):
        if idx < 30:
            book_weights.append(10.0)
        elif idx < 80:
            book_weights.append(5.0)
        elif idx < 150:
            book_weights.append(2.5)
        else:
            book_weights.append(1.0)

    # Map books by genre for favorite genre borrowing
    books_by_genre = {}
    for b in books:
        for g in b["genres"]:
            books_by_genre.setdefault(g, []).append(b)

    loans = []
    loan_counter = 1
    
    # Target distribution: ~80% returned (1120), ~12% active (168), ~8% overdue (112) -> total 1400
    TOTAL_LOANS = 1400
    RETURNED_COUNT = int(TOTAL_LOANS * 0.80)
    ACTIVE_COUNT = int(TOTAL_LOANS * 0.12)
    OVERDUE_COUNT = TOTAL_LOANS - RETURNED_COUNT - ACTIVE_COUNT
    
    # Active tracker to prevent duplicate active loans of same book by same member
    active_book_member_set = set()
    book_active_loans_count = {b["book_id"]: 0 for b in books}
    
    def pick_book_for_member(member):
        # 70% inside favorite genres, 30% anywhere
        if random.random() < 0.70 and member["favorite_genres"]:
            fav_g = random.choice(member["favorite_genres"])
            candidates = books_by_genre.get(fav_g, books)
            return random.choice(candidates)
        else:
            return random.choices(books, weights=book_weights, k=1)[0]

    # Generate Returned Loans (past 12 months)
    for _ in range(RETURNED_COUNT):
        member = random.choice(members)
        book = pick_book_for_member(member)
        
        # Issued anywhere from 360 days ago to 25 days ago
        days_ago = random.randint(25, 360)
        issued_date = BASE_DATE - timedelta(days=days_ago, hours=random.randint(1, 10))
        loan_duration = 14
        due_date = issued_date + timedelta(days=loan_duration)
        
        # 85% returned on time, 15% returned slightly late with paid fine
        if random.random() < 0.85:
            return_days = random.randint(3, 14)
            fine = 0.0
        else:
            return_days = random.randint(15, 25)
            late_days = return_days - loan_duration
            fine = float(late_days * 2) # Rs 2/day
            
        return_date = issued_date + timedelta(days=return_days)
        
        loans.append({
            "loan_id": f"L{loan_counter:05d}",
            "book_id": book["book_id"],
            "book_title": book["title"],
            "member_id": member["member_id"],
            "issued_at": issued_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "due_at": due_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "returned_at": return_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "status": "returned",
            "renewals": random.choice([0, 0, 1, 2]),
            "fine_amount": fine
        })
        loan_counter += 1

    # Generate Active Loans (issued within last 13 days)
    for _ in range(ACTIVE_COUNT):
        # Find a member and book not already loaned
        for attempt in range(50):
            member = random.choice(members)
            book = pick_book_for_member(member)
            pair = (member["member_id"], book["book_id"])
            if pair not in active_book_member_set and book_active_loans_count[book["book_id"]] < (book["total_copies"] - 1):
                active_book_member_set.add(pair)
                book_active_loans_count[book["book_id"]] += 1
                break
                
        issued_days_ago = random.randint(1, 12)
        issued_date = BASE_DATE - timedelta(days=issued_days_ago, hours=random.randint(1, 12))
        due_date = issued_date + timedelta(days=14)
        
        loans.append({
            "loan_id": f"L{loan_counter:05d}",
            "book_id": book["book_id"],
            "book_title": book["title"],
            "member_id": member["member_id"],
            "issued_at": issued_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "due_at": due_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "returned_at": None,
            "status": "active",
            "renewals": random.choice([0, 1]),
            "fine_amount": 0.0
        })
        loan_counter += 1

    # Generate Overdue Loans (due date in the past, returned_at is None, fine Rs 2/day)
    for _ in range(OVERDUE_COUNT):
        for attempt in range(50):
            member = random.choice(members)
            book = pick_book_for_member(member)
            pair = (member["member_id"], book["book_id"])
            if pair not in active_book_member_set and book_active_loans_count[book["book_id"]] < (book["total_copies"] - 1):
                active_book_member_set.add(pair)
                book_active_loans_count[book["book_id"]] += 1
                break
                
        # Issued 16 to 45 days ago (so 2 to 31 days overdue)
        issued_days_ago = random.randint(16, 45)
        issued_date = BASE_DATE - timedelta(days=issued_days_ago, hours=random.randint(1, 12))
        due_date = issued_date + timedelta(days=14)
        days_overdue = (BASE_DATE - due_date).days
        fine = float(days_overdue * 2) # Rs 2 per day
        
        loans.append({
            "loan_id": f"L{loan_counter:05d}",
            "book_id": book["book_id"],
            "book_title": book["title"],
            "member_id": member["member_id"],
            "issued_at": issued_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "due_at": due_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "returned_at": None,
            "status": "overdue",
            "renewals": random.choice([0, 1]),
            "fine_amount": fine
        })
        loan_counter += 1

    # Update available_copies in book records
    for b in books:
        b["available_copies"] = max(0, b["total_copies"] - book_active_loans_count[b["book_id"]])

    # 4. Generate ~40 Reservations
    reservations = []
    res_counter = 1
    # Target books with low availability or popular
    popular_books = [b for b in books if b["available_copies"] <= 2]
    if len(popular_books) < 20:
        popular_books = books[:40]
        
    for _ in range(40):
        member = random.choice(members)
        book = random.choice(popular_books)
        res_date = BASE_DATE - timedelta(days=random.randint(1, 20), hours=random.randint(1, 8))
        status = random.choices(["pending", "fulfilled", "cancelled"], weights=[0.60, 0.30, 0.10])[0]
        
        reservations.append({
            "reservation_id": f"R{res_counter:04d}",
            "book_id": book["book_id"],
            "book_title": book["title"],
            "member_id": member["member_id"],
            "member_name": member["name"],
            "reserved_at": res_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "status": status,
            "priority": random.randint(1, 3)
        })
        res_counter += 1

    # 5. Generate ~450 Reviews
    # Consistent with borrowing history: members review books they have borrowed
    reviews = []
    review_counter = 1
    reviewed_pairs = set()
    book_ratings_accumulator = {b["book_id"]: [] for b in books}

    # First pass: members who borrowed the book
    borrowed_pairs = list(set((l["member_id"], l["book_id"]) for l in loans))
    random.shuffle(borrowed_pairs)
    
    for member_id, book_id in borrowed_pairs[:450]:
        if (member_id, book_id) in reviewed_pairs:
            continue
        reviewed_pairs.add((member_id, book_id))
        
        rating = random.choices([5, 4, 3, 2, 1], weights=[0.45, 0.35, 0.12, 0.05, 0.03])[0]
        book_ratings_accumulator[book_id].append(rating)
        comment = random.choice(REVIEW_COMMENTS)
        rev_date = BASE_DATE - timedelta(days=random.randint(2, 280), hours=random.randint(1, 12))
        
        # Find member name
        m_name = next((m["name"] for m in members if m["member_id"] == member_id), "Member")
        
        reviews.append({
            "review_id": f"REV{review_counter:04d}",
            "book_id": book_id,
            "member_id": member_id,
            "member_name": m_name,
            "rating": rating,
            "comment": comment,
            "created_at": rev_date.strftime("%Y-%m-%dT%H:%M:%SZ")
        })
        review_counter += 1

    # Update avg_rating and ratings_count on books
    for b in books:
        r_list = book_ratings_accumulator[b["book_id"]]
        if r_list:
            b["ratings_count"] = len(r_list)
            b["avg_rating"] = round(sum(r_list) / len(r_list), 2)
        else:
            b["ratings_count"] = 0
            b["avg_rating"] = 0.0

    # 6. Referential Integrity Validation
    book_ids = set(b["book_id"] for b in books)
    member_ids = set(m["member_id"] for m in members)
    author_ids = set(a["author_id"] for a in authors)

    for l in loans:
        assert l["book_id"] in book_ids, f"Foreign key error: book_id {l['book_id']} missing"
        assert l["member_id"] in member_ids, f"Foreign key error: member_id {l['member_id']} missing"

    for r in reservations:
        assert r["book_id"] in book_ids, f"Foreign key error: book_id {r['book_id']} missing"
        assert r["member_id"] in member_ids, f"Foreign key error: member_id {r['member_id']} missing"

    for rev in reviews:
        assert rev["book_id"] in book_ids, f"Foreign key error: book_id {rev['book_id']} missing"
        assert rev["member_id"] in member_ids, f"Foreign key error: member_id {rev['member_id']} missing"

    for b in books:
        assert b["available_copies"] >= 0, f"Negative copies on {b['book_id']}"
        assert b["available_copies"] <= b["total_copies"], f"Available > Total on {b['book_id']}"

    # 7. Write to data/raw/*.json
    out_dir = os.path.join(os.path.dirname(__file__), "raw")
    os.makedirs(out_dir, exist_ok=True)

    files_to_save = {
        "books.json": books,
        "authors.json": authors,
        "members.json": members,
        "loans.json": loans,
        "reservations.json": reservations,
        "reviews.json": reviews
    }

    for filename, data in files_to_save.items():
        filepath = os.path.join(out_dir, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    print("=" * 60)
    print("DATASET GENERATION COMPLETE - REFERENTIAL INTEGRITY VERIFIED")
    print("=" * 60)
    print(f"Books:        {len(books):>5}")
    print(f"Authors:      {len(authors):>5}")
    print(f"Members:      {len(members):>5} (including 3 librarians)")
    print(f"Loans:        {len(loans):>5} (Returned: {RETURNED_COUNT}, Active: {ACTIVE_COUNT}, Overdue: {OVERDUE_COUNT})")
    print(f"Reservations: {len(reservations):>5}")
    print(f"Reviews:      {len(reviews):>5}")
    print(f"Saved to:     {out_dir}")
    print("=" * 60)

if __name__ == "__main__":
    generate_dataset()
