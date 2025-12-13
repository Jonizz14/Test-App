#!/usr/bin/env python
"""
Script to run auto-expire sessions command periodically.
This can be run as a cron job or background process.

Usage:
- As a cron job (every minute): * * * * * /path/to/python /path/to/auto_expire_runner.py
- Manually: python auto_expire_runner.py
- With custom interval: python auto_expire_runner.py --interval 30
"""

import os
import sys
import time
import argparse
import subprocess
from datetime import datetime

def run_auto_expire():
    """Run the Django management commands to auto-expire sessions and premium subscriptions"""
    try:
        # Set up Django environment
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'testplatform.settings')

        # Add the project directory to Python path
        project_dir = os.path.dirname(os.path.abspath(__file__))
        sys.path.insert(0, project_dir)

        import django
        django.setup()

        # Run the session auto-expire command
        from django.core.management import execute_from_command_line
        execute_from_command_line(['manage.py', 'auto_expire_sessions'])

        # Run the premium expiration command
        execute_from_command_line(['manage.py', 'expire_premium'])

        print(f"[{datetime.now()}] Auto-expire commands executed successfully")

    except Exception as e:
        print(f"[{datetime.now()}] Error running auto-expire commands: {e}")
        return False

    return True

def main():
    parser = argparse.ArgumentParser(description='Run auto-expire sessions periodically')
    parser.add_argument('--interval', type=int, default=60,
                       help='Interval in seconds between runs (default: 60)')
    parser.add_argument('--once', action='store_true',
                       help='Run once and exit instead of running continuously')

    args = parser.parse_args()

    if args.once:
        # Run once and exit
        success = run_auto_expire()
        sys.exit(0 if success else 1)

    # Run continuously
    print(f"Starting auto-expire runner with {args.interval} second intervals...")
    print("Press Ctrl+C to stop")

    try:
        while True:
            run_auto_expire()
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nAuto-expire runner stopped")
        sys.exit(0)

if __name__ == '__main__':
    main()