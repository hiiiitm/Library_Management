import time
from collections import deque
from datetime import datetime, timezone
from typing import Any

# Rolling buffer of the latest 100 executed database queries for inspection
QUERY_HISTORY = deque(maxlen=100)

class QueryRecord:
    def __init__(
        self,
        database: str,          # "MongoDB" or "Neo4j"
        operation: str,         # e.g., "find_one_and_update", "aggregate", "MATCH", "shortestPath"
        query_text: str,        # Formatted Mongo JSON / Cypher query string
        params: dict = None,
        execution_ms: float = 0.0,
        purpose: str = "",
        records_affected: int = 0
    ):
        self.timestamp = datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3]
        self.database = database
        self.operation = operation
        self.query_text = query_text
        self.params = params or {}
        self.execution_ms = round(execution_ms, 2)
        self.purpose = purpose
        self.records_affected = records_affected

    def to_dict(self) -> dict:
        return {
            "timestamp": self.timestamp,
            "database": self.database,
            "operation": self.operation,
            "query_text": self.query_text,
            "params": self.params,
            "execution_ms": self.execution_ms,
            "purpose": self.purpose,
            "records_affected": self.records_affected
        }

def log_database_query(
    database: str,
    operation: str,
    query_text: str,
    params: dict = None,
    execution_ms: float = 0.0,
    purpose: str = "",
    records_affected: int = 0
) -> QueryRecord:
    rec = QueryRecord(
        database=database,
        operation=operation,
        query_text=query_text.strip(),
        params=params,
        execution_ms=execution_ms,
        purpose=purpose,
        records_affected=records_affected
    )
    QUERY_HISTORY.appendleft(rec)
    return rec

def get_recent_queries(limit: int = 50, database: str = None) -> list[dict]:
    results = []
    for item in list(QUERY_HISTORY):
        if database and item.database.lower() != database.lower():
            continue
        results.append(item.to_dict())
        if len(results) >= limit:
            break
    return results

def clear_query_history():
    QUERY_HISTORY.clear()
