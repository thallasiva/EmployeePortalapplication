"""
HRMS Stored Procedures Deployment Script
=========================================
Deploys all 234 stored procedures to AWS RDS MySQL.

HOW TO RUN (from Windows Command Prompt or PowerShell):
  1. Install PyMySQL if not installed:
       pip install pymysql

  2. Run this script from the backend/database folder:
       cd C:\TimeSheet\humanresourceshradmintemplate\backend\database
       python deploy_procedures.py
"""

import re
import sys

# ── Connection Settings ────────────────────────────────────────────────────────
HOST     = "hrms.c02gczm2cgx8.us-east-1.rds.amazonaws.com"
PORT     = 4306
USER     = "HRMSadmin"
PASSWORD = "HwULGJ6gbxQIhzwNeZ9L"
DATABASE = "hrms_db"
SQL_FILE = "all_procedures.sql"
# ──────────────────────────────────────────────────────────────────────────────

def parse_procedures(sql_content):
    """Parse SQL file with DELIMITER $$ syntax into individual statements."""
    statements = []
    current_delimiter = ";"
    current_stmt = []

    for line in sql_content.splitlines():
        stripped = line.strip()
        delimiter_match = re.match(r'DELIMITER\s+(\S+)', stripped, re.IGNORECASE)
        if delimiter_match:
            current_delimiter = delimiter_match.group(1)
            continue

        if stripped.endswith(current_delimiter):
            line_without_delim = line.rstrip()
            if line_without_delim.endswith(current_delimiter):
                line_without_delim = line_without_delim[:-len(current_delimiter)]
            current_stmt.append(line_without_delim)
            stmt = "\n".join(current_stmt).strip()
            if stmt:
                statements.append(stmt)
            current_stmt = []
        else:
            current_stmt.append(line)

    remaining = "\n".join(current_stmt).strip()
    if remaining:
        statements.append(remaining)

    return statements


def main():
    try:
        import pymysql
    except ImportError:
        print("ERROR: PyMySQL is not installed.")
        print("Run:  pip install pymysql")
        sys.exit(1)

    try:
        with open(SQL_FILE, "r", encoding="utf-8") as f:
            sql_content = f.read()
        print(f"Read {SQL_FILE} ({len(sql_content):,} bytes)")
    except FileNotFoundError:
        print(f"ERROR: {SQL_FILE} not found.")
        print("Make sure you are running from the backend/database directory.")
        sys.exit(1)

    statements = parse_procedures(sql_content)
    statements = [s for s in statements if len(s.strip()) > 10]
    print(f"Parsed {len(statements)} statements")

    print(f"\nConnecting to {HOST}:{PORT} ...")
    try:
        conn = pymysql.connect(
            host=HOST, port=PORT, user=USER, password=PASSWORD,
            database=DATABASE, charset="utf8mb4", connect_timeout=30,
        )
        print("Connected successfully!\n")
    except Exception as e:
        print(f"ERROR: Could not connect: {e}")
        sys.exit(1)

    cursor = conn.cursor()
    success_count = 0
    error_count = 0
    errors = []

    for i, stmt in enumerate(statements, 1):
        if re.match(r'^\s*USE\s+', stmt, re.IGNORECASE):
            continue
        cleaned = re.sub(r'--[^\n]*', '', stmt).strip()
        if not cleaned:
            continue

        try:
            cursor.execute(stmt)
            conn.commit()
            name_match = re.search(r'CREATE\s+PROCEDURE\s+(\w+)', stmt, re.IGNORECASE)
            if name_match:
                print(f"  [{i:3d}] OK  {name_match.group(1)}")
                success_count += 1
        except Exception as e:
            name_match = re.search(r'CREATE\s+PROCEDURE\s+(\w+)', stmt, re.IGNORECASE)
            proc_name = name_match.group(1) if name_match else f"stmt_{i}"
            print(f"  [{i:3d}] ERR {proc_name}: {e}")
            errors.append((proc_name, str(e)))
            error_count += 1

    cursor.close()

    try:
        verify_conn = pymysql.connect(
            host=HOST, port=PORT, user=USER, password=PASSWORD,
            database=DATABASE, charset="utf8mb4"
        )
        vcur = verify_conn.cursor()
        vcur.execute(
            "SELECT COUNT(*) FROM information_schema.ROUTINES "
            "WHERE ROUTINE_SCHEMA = %s AND ROUTINE_TYPE = 'PROCEDURE'",
            (DATABASE,)
        )
        db_count = vcur.fetchone()[0]
        vcur.close()
        verify_conn.close()
    except Exception:
        db_count = "unknown"

    print("\n" + "=" * 60)
    print(f"DEPLOYMENT COMPLETE")
    print(f"  Procedures deployed successfully : {success_count}")
    print(f"  Errors                          : {error_count}")
    print(f"  Procedures in DB (verified)     : {db_count}")
    print("=" * 60)

    if errors:
        print(f"\nFailed procedures ({len(errors)}):")
        for name, err in errors:
            print(f"  - {name}: {err}")

    conn.close()


if __name__ == "__main__":
    main()
