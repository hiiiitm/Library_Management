# NexLib — Dual-NoSQL Polyglot Library Management System
### MongoDB (Document Store & System of Record) + Neo4j (Graph Database & Relationship Brain) + React (Vite) + FastAPI

[![Python 3.12+](https://img.shields.io/badge/python-3.12%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![MongoDB 8.0](https://img.shields.io/badge/MongoDB-Community_8.0-47A248.svg)](https://www.mongodb.com/)
[![Neo4j 5+](https://img.shields.io/badge/Neo4j-Graph_DB-008CC1.svg)](https://neo4j.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Architecture Overview

NexLib implements a **Polyglot Persistence Architecture** combining the strengths of document and graph databases:

```
                      +---------------------------------------+
                      |         REACT FRONTEND (Vite)         |
                      |  - Dark Glassmorphism Design System   |
                      |  - Live Database Query Inspector      |
                      |  - Interactive Vis Network Canvas     |
                      +---------------------------------------+
                                          |
                                          | REST API (JSON)
                                          v
                      +---------------------------------------+
                      |       FASTAPI BACKEND SERVICES        |
                      |  - books_service      - loans_service |
                      |  - sync_service       - graph_service |
                      |  - analytics_service  - system_service|
                      +---------------------------------------+
                             |                         |
              PyMongo Driver |                         | Neo4j Driver
              (Reads / Writes)                         | (Graph Cypher)
                             v                         v
       +----------------------------+   Sync    +----------------------------+
       |     MONGODB COMMUNITY      |  Outbox   |      NEO4J GRAPH DB        |
       |  (Primary System of Record)| --------> |    (Relationship Brain)    |
       |  - 224 Book Records        |           |  - Book, Author, Genre,    |
       |  - 186 Authors, 150 Members|           |    Publisher, Member Nodes |
       |  - 1400 Loans, 450 Reviews |           |  - WROTE, IN_GENRE,        |
       |  - Atomic copy counters    |           |    BORROWED, SIMILAR_TO    |
       |  - Aggregation Pipelines   |           |  - Collaborative Filtering |
       +----------------------------+           +----------------------------+
```

### Responsibility Matrix

| Feature / Responsibility | MongoDB | Neo4j | Architectural Justification |
|---|---|---|---|
| Full Book Records (ISBN, shelf, pages, tags, reviews) | **Primary** | Only ID, title, year | Flexible schema accommodates nested arrays without relational joins. |
| Member Contacts & Roles | **Primary** | Only `member_id`, name | **Data minimisation**: Personal emails and phones omitted from the graph. |
| Circulation & Due Dates | **Primary** | `BORROWED` relationship edge | Atomic copy counter manipulation; loan graph edges enable temporal traversals. |
| Atomic Checkout Race Protection | **Yes (`$inc: -1`)** | No | `findOneAndUpdate` with `available_copies > 0` eliminates negative copy anomalies. |
| Catalogue Text Search | **Yes (Text Index)** | No | Stemmed multilingual text search across title, authors, tags, and description. |
| Dashboards & Aggregations | **Yes (6 Pipelines)** | No | Multi-stage pipeline framework ($unwind, $group, $bucket, $facet). |
| "Readers Who Borrowed This Also Borrowed" | No | **Yes (Cypher)** | Index-free adjacency traverses co-borrowing clusters in $O(1)$ per edge hop. |
| Personalized Member Recommendations | No | **Yes (Cypher)** | Graph matching identifies members with matching taste profiles. |
| Degrees of Separation (Shortest Path) | No | **Yes (shortestPath)** | Native bi-directional Dijkstra traversal between authors. |
| Content-Based Multi-Genre Overlap | No | **Yes (SIMILAR_TO)** | Graph edges weighted by shared genre and tag nodes. |

---

## Quickstart (Windows Local Setup)

### 1. Prerequisites
- Python 3.12 or 3.13 (`python --version`)
- Node.js v20+ and npm (`node --version`)
- MongoDB Community Server 8.0 running on `mongodb://127.0.0.1:27017`
- Neo4j Desktop 2 running on `bolt://127.0.0.1:7687` (default credentials in `.env`)

### 2. Virtual Environment & Dependencies
```bash
# In the project root directory
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Generate Seed Dataset & Populate Databases
```bash
# 1. Deterministic dataset generation (Seed 42) -> 224 books, 150 members, 1400 loans, 450 reviews
python -m data.generate_dataset

# 2. Seed MongoDB System of Record with indexes
python scripts/seed_mongo.py

# 3. Seed Neo4j Graph Database with constraints and relationships
python scripts/seed_neo4j.py

# (Alternatively, run both via master seeder):
python scripts/seed_all.py --env local

# 4. Verify system with automated end-to-end health check
python scripts/health_check.py
```

### 4. Run Automated Smoke Tests
```bash
pytest -v tests/test_smoke.py
```

### 5. Launch Application

**Option A (Easiest — 1-Click for Windows)**:
Double-click `start.bat` in the project root! It automatically activates the environment and launches both servers.

**Option B (Single Command Launcher)**:
```bash
python run.py
```
This starts both servers and opens `http://127.0.0.1:5173/` in your browser.

**Option C (Two Separate Terminals)**:
In two separate terminals:

**Terminal 1 — FastAPI Backend**:
```bash
.venv\Scripts\activate
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — React Frontend (Vite)**:
```bash
cd frontend
npm install
npm run dev
```

Open your browser at **`http://127.0.0.1:5173/`**.

---

## Complete Setup & Sharing Guide
If you are cloning this project or running it on a new computer, read the complete step-by-step guide:
👉 **[Complete Student & Setup Guide (SETUP_GUIDE.md)](SETUP_GUIDE.md)**


## Core Application Pages

1. **Dashboard**: 5 KPI summary cards (Total Books, Physical Copies, Active Loans, Overdue, Registered Members, Fines Due), circulation attention queue, and high-circulation book cards.
2. **Catalogue**: Real-time full-text search across book titles, descriptions, and tags with multi-genre filters, author filters, availability toggle, and gradient book covers.
3. **Book Detail**: Full MongoDB document record, availability counter, reader reviews, and Neo4j real-time intelligence sections (*Readers who borrowed this also borrowed*, *More by this author*, *Similar books*).
4. **Circulation Workbench**: Librarian checkout desk with atomic inventory decrements, book returns with late fine calculation (Rs. 2/day), loan renewals (max 2), and fine payments.
5. **Members Directory**: Member directory, search, member detail modal with active loans, loan history, and personalized Neo4j suggestions for that specific member.
6. **Manage Books**: Librarian CRUD interface for creating, modifying, and detaching titles with synchronized dual-database updates (MongoDB + Neo4j).
7. **Recommendations Hub**: Dedicated recommendation center with personalized collaborative filtering graph traversals and dynamic "Why this is recommended" badges.
8. **Graph Explorer**: Interactive Vis Network canvas showing author-book graphs, genre maps, and an interactive **Degrees of Separation / Shortest Path** tool between any two authors!
9. **Analytics**: 6 native MongoDB aggregation pipelines visualized with live charts and expandable pipeline JSON syntax inspectors.
10. **System & DB Inspector**: Live engine connectivity cards, collection statistics, node/relationship counts, and Sync Outbox replay tools.

---

## Live Database Query Inspector

Every card, search action, circulation transaction, and aggregation chart includes a clickable **"Show Query"** badge. Clicking it launches the **Database Query Inspector** modal displaying:
- Target Database badge (`MongoDB` or `Neo4j`)
- Operation type (`findOneAndUpdate`, `aggregate`, `shortestPath`, etc.)
- Formatted query syntax (JSON pipeline or Cypher query)
- Execution latency in milliseconds and records affected
- Plain-English academic justification of why that database was chosen for that specific query

---

## Project Documentation
- [MongoDB Query Catalog](docs/mongo_queries.md) — Comprehensive explanation of all 6 aggregation pipelines and single-document atomic operations.
- [Neo4j Cypher Catalog](docs/cypher_queries.md) — All graph traversal algorithms, collaborative filtering, and shortest-path queries.
- [Academic Report Outline](docs/report_outline.md) — Architectural justification, polyglot persistence tradeoffs, and schema diagrams.
- [Screenshot Checklist](docs/screenshot_checklist.md) — Exact screens and database inspector views to capture for your submission.
- [5-Minute Demo Script](docs/demo_script.md) — Step-by-step presentation script for viva defense.
