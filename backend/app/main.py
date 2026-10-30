from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.db.mongo_client import get_mongo_client, ensure_indexes, init_mock_storage
from backend.app.db.neo4j_client import get_neo4j_driver, ensure_constraints, init_mock_graph
from backend.app.routes import (
    books,
    members,
    circulation,
    recommendations,
    graph,
    analytics,
    system
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup checks
    _, mongo_ok = get_mongo_client()
    if mongo_ok:
        ensure_indexes()
    else:
        init_mock_storage()

    _, neo_ok = get_neo4j_driver()
    if neo_ok:
        ensure_constraints()
    else:
        init_mock_graph()
        
    yield

app = FastAPI(
    title="Library Management System API",
    description="Dual-Database NoSQL Architecture: MongoDB (System of Record) + Neo4j (Relationship Brain)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(books.router)
app.include_router(members.router)
app.include_router(circulation.router)
app.include_router(recommendations.router)
app.include_router(graph.router)
app.include_router(analytics.router)
app.include_router(system.router)

@app.get("/")
def root():
    return {
        "app": "Library Management System API",
        "databases": {
            "mongo": settings.MONGO_DB,
            "neo4j": settings.NEO4J_DATABASE
        },
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
