"""
Master Unified Seeder Script
Usage:
  python scripts/seed_all.py --env local
  python scripts/seed_all.py --env cloud
"""

import argparse
import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.seed_mongo import seed_mongo
from scripts.seed_neo4j import seed_neo4j

def main():
    parser = argparse.ArgumentParser(description="Seed MongoDB and Neo4j for Library Management System")
    parser.add_argument("--env", choices=["local", "cloud"], default="local", help="Environment target (local or cloud)")
    args = parser.parse_args()

    print(f"\n============================================================")
    print(f"RUNNING DATABASE SEEDER [{args.env.upper()} ENVIRONMENT]")
    print(f"============================================================\n")

    if args.env == "cloud":
        cloud_env = Path(__file__).resolve().parent.parent / ".env.cloud"
        if cloud_env.exists():
            from dotenv import load_dotenv
            load_dotenv(dotenv_path=cloud_env, override=True)
            print(f"Loaded cloud configuration from: {cloud_env}")
        else:
            print("Note: .env.cloud not found; using standard environment variables.")

    print("\n--- [1/2] Seeding MongoDB System of Record ---")
    seed_mongo()

    print("\n--- [2/2] Seeding Neo4j Relationship Brain ---")
    seed_neo4j()

    print("\n============================================================")
    print("ALL DATABASES SEEDED AND SYNCHRONIZED SUCCESSFULLY!")
    print("============================================================\n")

if __name__ == "__main__":
    main()
