#!/usr/bin/env python3
"""Create and validate an online SQLite backup without exposing row data."""

import argparse
import os
import sqlite3
import sys


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("destination")
    args = parser.parse_args()

    if not os.path.isfile(args.source):
        parser.error("source database does not exist")
    if os.path.exists(args.destination):
        parser.error("destination already exists")

    source = sqlite3.connect(f"file:{args.source}?mode=ro", uri=True)
    destination = sqlite3.connect(args.destination)
    try:
        source.backup(destination)
        result = destination.execute("PRAGMA integrity_check").fetchone()
        if result != ("ok",):
            print("backup integrity check failed", file=sys.stderr)
            return 1
    finally:
        destination.close()
        source.close()

    os.chmod(args.destination, 0o600)
    print(f"backup_ok size={os.path.getsize(args.destination)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
