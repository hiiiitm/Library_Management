# Complete Student & Setup Guide for NexLib
### Polyglot NoSQL Library Management System (MongoDB + Neo4j + FastAPI + React)

---

## 1. Project Overview & Academic Concept

### What is this project?
**NexLib** is a university-level NoSQL Library Management System built with a **Polyglot Persistence Architecture**. Instead of forcing one database to do everything, it uses **two different NoSQL databases together**, assigning each engine to what it does best:

1. **MongoDB (Document Store — The System of Record)**:
   * **Why it's used**: Handles rich, nested JSON documents (books with multiple authors, genre arrays, tags, member contact records, loan histories, reviews, and reservations).
   * **Key Strengths**: Fast key-value lookups, full-text search across titles/descriptions/tags, atomic single-document updates (`findOneAndUpdate`) for inventory control without multi-document locking overhead, and multi-stage aggregation pipelines for reports.
   * **Collections (8)**: `books`, `authors`, `members`, `loans`, `reservations`, `reviews`, `audit_log`, `sync_outbox`.

2. **Neo4j (Graph Database — The Relationship Brain)**:
   * **Why it's used**: Real-time graph traversals using native **index-free adjacency**. Traversing relationships in Neo4j takes $O(1)$ time per hop regardless of total database size, whereas relational SQL or document databases require expensive multi-table JOINs or nested lookups.
   * **Key Strengths**: Collaborative filtering ("Readers who borrowed this also borrowed..."), personalized taste-profile recommendations, multi-genre co-occurrence networks, and calculating the exact shortest path (degrees of separation) between authors.
   * **Nodes & Edges**:
     * Nodes: `Book`, `Author`, `Genre`, `Publisher`, `Member`.
     * Relationships: `WROTE`, `IN_GENRE`, `PUBLISHED_BY`, `BORROWED`, `RATED`, `SIMILAR_TO`.
   * **Data Minimization**: Personal identifiable information (PII) like emails and phone numbers are kept strictly in MongoDB and omitted from Neo4j.

3. **FastAPI (Backend API)**:
   * Python 3.12+ high-performance REST API.
   * Handles database connections, business validation rules, the **Sync Outbox Pattern** (dual-write orchestration), and logging every query executed.

4. **React + Vite (Modern Dark Frontend)**:
   * Dark glassmorphism interface using custom CSS tokens (no Tailwind).
   * Visual network canvas using Vis Network.
   * Live **Database Query Inspector** displaying real queries and latency on every action.

---

## 2. Before You Make the ZIP File (Important!)

When sharing this project with your friend, **do NOT include the virtual environment or node packages in the zip**. They are huge (over 500 MB) and are compiled specifically for your computer's paths.

### Files/Folders to EXCLUDE from the ZIP:
* ❌ `.venv/` (Python virtual environment — your friend will generate their own with 1 command)
* ❌ `frontend/node_modules/` (Node packages — your friend will generate their own with 1 command)
* ❌ `frontend/dist/` (build output)
* ❌ `__pycache__/` (Python cache folders)

### Files/Folders to INCLUDE in the ZIP:
* ✅ `backend/`
* ✅ `frontend/` (everything except `node_modules`)
* ✅ `data/` (including `seed_books.py` and `generate_dataset.py`)
* ✅ `scripts/` (all seed and health check scripts)
* ✅ `docs/` (all Markdown query catalogs and report guides)
* ✅ `tests/` (`test_smoke.py`)
* ✅ `requirements.txt`
* ✅ `start.bat` & `run.py`
* ✅ `.env` (or `.env.example`)
* ✅ `README.md`

---

## 3. First-Time Setup on Your Friend's Computer

Send these exact instructions to your friend:

### Step 1: Install Required Software (Prerequisites)
Make sure you have the following installed on Windows:
1. **Python 3.12 or 3.13**: Download from [python.org](https://www.python.org/). **Crucial:** Tick the box that says *"Add python.exe to PATH"* during installation.
2. **Node.js (v20 or newer)**: Download from [nodejs.org](https://nodejs.org/) (LTS version). This includes `npm`.
3. **MongoDB Community Server 8.0**: Download the MSI from [MongoDB Download Center](https://www.mongodb.com/try/download/community). Keep *"Install MongoD as a Service"* and *"Install MongoDB Compass"* checked.
4. **Neo4j Desktop 2**: Download from [neo4j.com/download](https://neo4j.com/download/).

---

### Step 2: Extract the ZIP
Extract the ZIP to any folder (e.g., `C:\Projects\LMS` or `C:\Users\username\LMS`). Open PowerShell or Command Prompt in that extracted folder.

---

### Step 3: Set Up Python Virtual Environment
Run these commands in PowerShell:
```powershell
# 1. Create the virtual environment
python -m venv .venv

# 2. Activate it
.\.venv\Scripts\activate

# 3. Upgrade pip and install all backend requirements
pip install -r requirements.txt
```

---

### Step 4: Install React Frontend Packages
```powershell
cd frontend
npm install
cd ..
```

---

### Step 5: Start the Databases

#### 1. MongoDB:
MongoDB is already running as a background service on your Windows PC!
* To verify, open **MongoDB Compass** and click **Connect** to `mongodb://127.0.0.1:27017`.

#### 2. Neo4j Desktop:
1. Open **Neo4j Desktop**.
2. Click **Add** -> **Local DBMS** (or *Create a Local Database*).
3. Set the Name to `library-graph`.
4. Set the Password to `librarypassword` (matches `.env`).
5. Choose version `5.x LTS` (e.g. 5.26).
6. Click **Create**, then click the blue **Start** button on the database card.
7. Wait until it displays a green dot with **Active / Running**.

---

### Step 6: Generate Dataset & Seed the Databases
Run these commands in your activated `.venv` terminal (from the project root):
```powershell
# 1. Generate the deterministic 2,500 record dataset (Seed 42)
python data\generate_dataset.py

# 2. Seed MongoDB (creates 8 collections and text/unique indexes)
python scripts\seed_mongo.py

# 3. Seed Neo4j (creates nodes, relationships, and constraints)
python scripts\seed_neo4j.py

# 4. Run the automated health check (All 7 checks will pass)
python scripts\health_check.py

# 5. Run the smoke tests (all 4 tests will pass)
pytest -v tests\test_smoke.py
```

---

## 4. How to Run the Application (Everyday Use)

Once the initial setup is finished, running the app anytime in the future is super simple!

### Method 1: The 1-Click Way (Easiest!)
Just **double-click the `start.bat` file** in Windows Explorer.
It will automatically activate `.venv`, start the FastAPI backend on port 8000, start the React frontend on port 5173, and keep both running in friendly windows.

### Method 2: Single Command
In PowerShell:
```powershell
python run.py
```
This starts both servers and automatically opens `http://127.0.0.1:5173` in your browser. Press `Ctrl + C` in the terminal to stop both servers whenever you're done.

### Method 3: Two Separate Terminals (Manual)
* **Terminal 1 (Backend)**:
  ```powershell
  .\.venv\Scripts\activate
  python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
  ```
* **Terminal 2 (Frontend)**:
  ```powershell
  cd frontend
  npm run dev
  ```

---

## 5. Walkthrough of Every Page in the Application

Open your browser to: **`http://127.0.0.1:5173`**

### 1. Global Role Switcher (Top Navbar)
* **What it does**: Allows you to switch roles between **"Librarian"** and **"Member"** (e.g., *Aarav Sharma*).
* **Why it matters**: Demonstrates Role-Based Access Control (RBAC). When logged in as a Member, circulation and inventory edit pages disappear, and personal book recommendations are dynamically tailored to that member's reading history.

---

### 2. Dashboard (`/`)
* **What it shows**:
  * **5 Top KPI Cards**: Total Books (224), Total Physical Copies (1,068), Active Loans (168), Overdue Loans (112), and Total Unpaid Fines.
  * **Loan Activity by Month**: Bar chart showing borrowing velocity over the last 12 months.
  * **Top Borrowed Books & Genres**: Ranked by circulation counts.
  * **Overdue Circulation Attention Queue**: Lists overdue members with calculated fines (Rs. 2 per day overdue).
* **Under the Hood**: Uses MongoDB native `$group`, `$sort`, and `$sum` aggregation pipelines.

---

### 3. Catalogue (`/catalogue`)
* **What it shows**:
  * Complete searchable grid of all 224 library books with custom gradient book covers generated based on genre colors.
  * Real-time search bar that filters on title, author names, description, and tags.
  * Filter pills for Genre (Fiction, Sci-Fi, Computer Science, Indian Authors, Philosophy, etc.).
  * Availability toggle: "Show only books with available copies".
* **Under the Hood**: Uses MongoDB's **stemmed full-text index** (`$text: { $search: ... }`).

---

### 4. Book Detail (`/books/:id`)
* **What it shows**:
  * Complete book record from MongoDB: ISBN-13, publication year, publisher, language, shelf location, tags, full description, and physical copy inventory.
  * Reader ratings and reviews with 1–5 star distributions.
  * **Neo4j Intelligence Panel**:
    * *"Readers who borrowed this also borrowed..."* (collaborative filtering).
    * *"More by this author"*.
    * *"Similar books sharing 2+ genres"*.
* **Under the Hood**: Fetches full document from MongoDB, then executes Cypher pattern matching against Neo4j in parallel.

---

### 5. Circulation Workbench (`/circulation` — Librarian Only)
* **What it shows**:
  * **Issue / Checkout Tab**: Select a member and book to issue a 14-day loan.
    * *Atomic Race Condition Protection*: Uses `findOneAndUpdate({ book_id, available_copies: { $gt: 0 } }, { $inc: { available_copies: -1 } })`. Copies will NEVER drop below 0.
    * *Validation Rules*: Blocks members with more than 5 active loans, members with unpaid fines over Rs. 50, or duplicate active loans.
  * **Return Tab**: Processes returns, calculates late fines (Rs. 2/day), and atomically increments available copies (`$inc: { available_copies: 1 }`).
  * **Renewals Tab**: Extends due date by 14 days (maximum 2 renewals per loan).
  * **Fines Tab**: Lists all members with overdue balances and allows recording fine payments.
  * **Reservations Queue**: Allows placing a hold when available copies reach 0.

---

### 6. Members Directory (`/members`)
* **What it shows**:
  * Searchable list of all 150 members with membership tier (Student, Faculty, Regular), status, and join date.
  * Member Details modal:
    * Active loans & overdue alerts.
    * Lifetime borrowing history.
    * **Personalized Recommendations**: A list of books recommended specifically for this member based on readers with similar tastes in the Neo4j graph!

---

### 7. Manage Books (`/manage-books` — Librarian Only)
* **What it shows**:
  * Interface to add a new book or edit/delete existing books.
  * **Dual-Write Architecture**: Writing a book creates the document in MongoDB first, then immediately updates the `Book`, `Author`, `Genre`, and `Publisher` nodes in Neo4j. If Neo4j is temporarily down, the write is saved in `sync_outbox` so no data is lost!

---

### 8. Recommendations Hub (`/recommendations`)
* **What it shows**:
  * **Personalized Member Recommendations**: Select any member from the dropdown to see books borrowed by readers with similar tastes that this member has not yet read.
  * **Item-to-Item Recommendations**: Select any book to see the top co-borrowed books.
  * **Explainability Badges**: Shows *why* the book is recommended (e.g., *"3 co-borrowers in common"*, *"Shares 3 genres"*).
* **Under the Hood**: Pure Neo4j Cypher collaborative filtering traversals.

---

### 9. Graph Explorer (`/graph`)
* **What it shows**:
  * **Interactive Vis Network Canvas**: Interactive, physics-based network canvas. You can drag nodes, zoom in, and click nodes to view details.
  * Modes:
    1. **Author Network**: Shows authors and their books.
    2. **Genre Map**: Visualizes books clustered by genres.
    3. **Book Neighborhood**: Visualizes a book and all members who borrowed it.
  * **Degrees of Separation (Shortest Path Tool)**:
    * Select any two authors (e.g., *Arthur Conan Doyle* and *George Orwell*).
    * Click "Find Path" to execute Neo4j's native `shortestPath` Dijkstra algorithm and visualize the exact chain connecting them!

---

### 10. Analytics (`/analytics`)
* **What it shows**:
  * 6 advanced MongoDB aggregation pipelines visualized with interactive charts:
    1. **Loans by Month & Status** (`$group`, `$dateToString`)
    2. **Top 10 High-Demand Genres** (`$unwind`, `$group`, `$sort`)
    3. **Book Page Count Distribution** (`$bucket`)
    4. **Member Activity Tiers** (`$lookup`, `$group`, `$facet`)
    5. **Average Rating by Genre** (`$unwind`, `$group`)
    6. **Overdue Fine Aging Analysis** (`$match`, `$project`)
  * Every card has a **"View Pipeline JSON"** toggle to inspect the raw MongoDB pipeline syntax!

---

### 11. System & Database Inspector (`/system`)
* **What it shows**:
  * Real-time connection status and latency for both **MongoDB** and **Neo4j**.
  * Total document counts across all 8 MongoDB collections.
  * Total node counts (Book, Author, Genre, Publisher, Member) and relationship counts in Neo4j.
  * **Sync Outbox Status**: Displays queued synchronization events and provides buttons for:
    * **"Replay Failed Syncs"** (retries any pending graph events).
    * **"Rebuild Entire Graph from MongoDB"** (completely recreates the Neo4j graph from MongoDB documents in seconds).

---

### 12. The Database Query Inspector Modal (Academic Feature)
* **What it is**:
  * Look for the little badge on any feature (e.g., `[⚡ MongoDB find 0.8ms]` or `[⚡ Neo4j Cypher 3.5ms]`) or click the floating badge in the bottom-right corner.
  * Clicking it opens a modal showing:
    1. The target database (**MongoDB** or **Neo4j**).
    2. The exact query syntax (MongoDB JSON query or Neo4j Cypher).
    3. Real execution time in milliseconds.
    4. An **Educational Justification** explaining why this query was assigned to this specific database!

---

## 6. Codebase Architecture & File Structure

```
LMS/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI entrypoint, CORS, route registration
│   │   ├── config.py                   # Environment settings and business logic constants
│   │   ├── db/
│   │   │   ├── mongo_client.py         # PyMongo singleton, index setup, atomic helpers
│   │   │   └── neo4j_client.py         # Neo4j driver singleton, constraints, Cypher logger
│   │   ├── routes/
│   │   │   ├── books.py                # Catalogue and book detail endpoints
│   │   │   ├── circulation.py          # Checkout, return, renew, fines endpoints
│   │   │   ├── members.py              # Member directory and loan history endpoints
│   │   │   ├── recommendations.py      # Neo4j collaborative recommendation endpoints
│   │   │   ├── graph.py                # Graph explorer and shortest path endpoints
│   │   │   ├── analytics.py            # MongoDB aggregation pipeline endpoints
│   │   │   └── system.py               # Database health and sync outbox endpoints
│   │   ├── services/                   # Business logic layer
│   │   │   ├── books_service.py        # MongoDB book CRUD and search
│   │   │   ├── loans_service.py        # Atomic circulation and late fine calculation
│   │   │   ├── recommendations_service.py # Cypher collaborative filtering queries
│   │   │   ├── graph_service.py        # Cypher shortest path and subgraphs
│   │   │   ├── analytics_service.py    # 6 MongoDB aggregation pipelines
│   │   │   ├── sync_service.py         # Sync Outbox dual-write orchestrator
│   │   │   └── system_service.py       # Live database diagnostics
│   │   └── utils/
│   │       ├── dates.py, fines.py, ids.py # Helper calculation utilities
│   │       └── query_log.py            # In-memory query logger for Query Inspector
├── frontend/
│   ├── src/
│   │   ├── main.jsx                    # React entrypoint
│   │   ├── App.jsx                     # Route definitions and layout wrapper
│   │   ├── index.css                   # Dark glassmorphic design system (CSS variables)
│   │   ├── api/client.js               # Centralized Axios API client
│   │   ├── context/AppContext.jsx      # Global state (Role switcher, query modal state)
│   │   ├── components/                 # Reusable UI components
│   │   │   ├── Navbar.jsx              # Navigation and role switcher
│   │   │   ├── Sidebar.jsx             # Collapsible sidebar navigation
│   │   │   ├── BookCard.jsx            # Dynamic gradient cover book card
│   │   │   ├── KpiCard.jsx             # Metric counter card
│   │   │   ├── QueryBadge.jsx          # Live query trigger button
│   │   │   ├── QueryInspectorModal.jsx # Academic query inspection dialog
│   │   │   └── ToastContainer.jsx      # Notifications system
│   │   └── pages/                      # All 10 application views
│   │       ├── DashboardPage.jsx
│   │       ├── CataloguePage.jsx
│   │       ├── BookDetailPage.jsx
│   │       ├── CirculationPage.jsx
│   │       ├── MembersPage.jsx
│   │       ├── ManageBooksPage.jsx
│   │       ├── RecommendationsPage.jsx
│   │       ├── GraphExplorerPage.jsx
│   │       ├── AnalyticsPage.jsx
│   │       └── SystemPage.jsx
│   ├── index.html
│   ├── vite.config.js                  # Vite bundler configuration with API proxy
│   └── package.json
├── data/
│   ├── seed_books.py                   # 224 curated real books across 18 genres
│   ├── generate_dataset.py             # Deterministic synthetic dataset generator (Seed 42)
│   └── raw/                            # Generated JSON files (books, members, loans, etc.)
├── scripts/
│   ├── seed_mongo.py                   # Seeds MongoDB collections and indexes
│   ├── seed_neo4j.py                   # Seeds Neo4j nodes and Cypher relationships
│   ├── seed_all.py                     # Master seeding orchestrator (--env local | cloud)
│   └── health_check.py                 # Automated 7-point health check verification
├── tests/
│   └── test_smoke.py                   # Automated Pytest suite (atomicity, fines, cypher)
├── docs/
│   ├── mongo_queries.md                # Comprehensive catalog of all MongoDB queries
│   ├── cypher_queries.md               # Comprehensive catalog of all Neo4j Cypher queries
│   ├── report_outline.md               # Academic project report outline
│   ├── screenshot_checklist.md         # Checklist of screens to capture for viva
│   └── demo_script.md                  # 5-minute presentation script
├── start.bat                           # 1-click launcher for Windows
├── run.py                              # Simple Python launcher
├── requirements.txt                    # Pinned Python dependencies
└── .env                                # Local database connection credentials
```

---

## 7. How to Verify Both Databases Directly

### 1. In MongoDB Compass:
* Connect to `mongodb://127.0.0.1:27017`.
* Click `library_db`.
* Browse any collection (`books`, `loans`, `members`).
* Filter `books` by `{ available_copies: { $gt: 0 } }` or `{ genres: "Science Fiction" }`.

### 2. In Neo4j Browser:
* In Neo4j Desktop, click **Open** on `library-graph`.
* Test these sample Cypher queries:
  ```cypher
  // See top borrowed books
  MATCH (m:Member)-[:BORROWED]->(b:Book)
  RETURN b.title AS Title, count(m) AS Borrows
  ORDER BY Borrows DESC
  LIMIT 10;

  // See shortest path between two authors
  MATCH p = shortestPath((a1:Author {author_id: "A0001"})-[*]-(a2:Author {author_id: "A0025"}))
  RETURN p;
  ```

---

## 8. Summary of Commands (Quick Reference)

| Task | Command |
|---|---|
| **Easiest App Launcher (1-click)** | Double-click `start.bat` |
| **Python App Launcher (1-command)** | `python run.py` |
| **Run Health Check** | `.venv\Scripts\python scripts/health_check.py` |
| **Run Automated Tests** | `.venv\Scripts\pytest -v tests/test_smoke.py` |
| **Re-seed MongoDB** | `.venv\Scripts\python scripts/seed_mongo.py` |
| **Re-seed Neo4j** | `.venv\Scripts\python scripts/seed_neo4j.py` |
| **Re-seed Everything** | `.venv\Scripts\python scripts/seed_all.py --env local` |
