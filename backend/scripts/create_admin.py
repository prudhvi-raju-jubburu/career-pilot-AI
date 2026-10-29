#!/usr/bin/env python3
"""
CareerPilot AI — Admin Bootstrap CLI Command

Safely provisions the first administrator or promotes an existing account to admin.
Enforces security rules:
- Never makes the first registered user an administrator automatically.
- Never exposes a public API for role self-promotion.
- Requires explicit console/terminal execution with credential validation.

Usage:
    python backend/scripts/create_admin.py --email admin@careerpilot.ai --name "Platform Admin"
    python backend/scripts/create_admin.py --email existing_user@domain.com --promote
"""

import sys
import os
import argparse
import getpass
import re

# Set encoding to utf-8 if supported
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Ensure backend root is on sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Disable background scheduler during one-off management command
os.environ["ENABLE_BACKGROUND_SCHEDULER"] = "false"

from app import create_app
from app.models.user import UserModel
from app.models.audit_log import AuditLogModel
from app.services.scheduler import shutdown_scheduler

EMAIL_REGEX = re.compile(r"^[\w\.-]+@([\w\.-]+\.)+[\w-]{2,4}$")

def parse_args():
    parser = argparse.ArgumentParser(description="Securely provision or promote a CareerPilot AI administrator.")
    parser.add_argument("--email", required=True, help="Administrator email address")
    parser.add_argument("--name", default="Platform Administrator", help="Administrator display name")
    parser.add_argument("--password", help="Administrator password (prompted securely if omitted)")
    parser.add_argument("--promote", action="store_true", help="Promote existing student account to administrator")
    return parser.parse_args()

def main():
    args = parse_args()
    email = args.email.strip().lower()

    if not EMAIL_REGEX.match(email):
        print(f"[ERROR] '{email}' is not a valid email address.", file=sys.stderr)
        sys.exit(1)

    app = create_app()
    with app.app_context():
        try:
            existing_user = UserModel.find_by_email(email)

            if existing_user:
                user_id = str(existing_user["_id"])
                current_role = existing_user.get("role", "student")
                if current_role == "admin":
                    print(f"[INFO] User '{email}' is already an administrator (Status: {existing_user.get('status', 'active')}).")
                    sys.exit(0)

                if not args.promote:
                    print(
                        f"[WARNING] An account with email '{email}' already exists with role '{current_role}'.\n"
                        f"   To promote this existing account to administrator, re-run with --promote.",
                        file=sys.stderr
                    )
                    sys.exit(1)

                # Promote existing user
                UserModel.update_role(user_id, "admin")
                UserModel.update_status(user_id, "active")

                AuditLogModel.record(
                    admin_id="CLI_SYSTEM",
                    admin_email="system@careerpilot.internal",
                    action="ADMIN_PROMOTED_VIA_CLI",
                    target_type="user",
                    target_id=user_id,
                    details={"promoted_email": email, "previous_role": current_role}
                )

                print(f"[SUCCESS] Successfully promoted existing account '{email}' ({user_id}) to administrator role.")
                sys.exit(0)

            # Create new admin account
            password = args.password
            if not password:
                password = getpass.getpass("Enter administrator password (min 6 chars): ")
                confirm = getpass.getpass("Confirm administrator password: ")
                if password != confirm:
                    print("[ERROR] Passwords do not match.", file=sys.stderr)
                    sys.exit(1)

            if len(password) < 6:
                print("[ERROR] Password must be at least 6 characters long.", file=sys.stderr)
                sys.exit(1)

            new_user = UserModel.create_user(
                name=args.name.strip(),
                email=email,
                password=password,
                role="admin",
                status="active"
            )
            new_id = str(new_user["_id"])

            AuditLogModel.record(
                admin_id="CLI_SYSTEM",
                admin_email="system@careerpilot.internal",
                action="ADMIN_BOOTSTRAPPED_VIA_CLI",
                target_type="user",
                target_id=new_id,
                details={"email": email, "name": args.name.strip()}
            )

            print(f"[SUCCESS] Successfully provisioned new administrator account:\n"
                  f"   - ID: {new_id}\n"
                  f"   - Name: {args.name.strip()}\n"
                  f"   - Email: {email}\n"
                  f"   - Role: admin\n"
                  f"   - Status: active\n")
        finally:
            shutdown_scheduler()

if __name__ == "__main__":
    main()
