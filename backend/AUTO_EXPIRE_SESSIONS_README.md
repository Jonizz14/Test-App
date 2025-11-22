# Auto-Expire Test Sessions

This system automatically expires and completes test sessions when students leave the page or when time runs out, even if they close their browser.

## How It Works

1. **Frontend Timer**: The React app has a timer that counts down and auto-submits when time reaches zero (if student is still on page).

2. **Backend Auto-Expiration**: A Django management command runs periodically to find and expire sessions that have run out of time.

3. **Answer Preservation**: When a session expires, all answers that were saved during the session are preserved and used to calculate the final score.

## Setup Instructions

### 1. Run the Auto-Expire Command Periodically

You have several options to run the auto-expiration:

#### Option A: Using the Runner Script (Recommended)
```bash
# Run once
python3 backend/auto_expire_runner.py --once

# Run continuously every 60 seconds (default)
python3 backend/auto_expire_runner.py

# Run continuously every 30 seconds
python3 backend/auto_expire_runner.py --interval 30
```

#### Option B: Using Cron Job (Linux/Mac)
Add this to your crontab (`crontab -e`):
```bash
# Run every minute
* * * * * cd /path/to/your/project && python3 backend/auto_expire_runner.py --once
```

#### Option C: Using Django Management Command Directly
```bash
# Dry run (shows what would be done)
python3 backend/manage.py auto_expire_sessions --dry-run

# Actually expire sessions
python3 backend/manage.py auto_expire_sessions
```

### 2. Production Deployment

For production, set up the auto-expire runner as a background service:

**Systemd Service (Linux):**
Create `/etc/systemd/system/test-auto-expire.service`:
```ini
[Unit]
Description=Test Auto-Expire Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/your/project
ExecStart=/usr/bin/python3 backend/auto_expire_runner.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then enable and start:
```bash
sudo systemctl enable test-auto-expire
sudo systemctl start test-auto-expire
```

## Technical Details

### Files Modified/Created

- `backend/api/management/commands/auto_expire_sessions.py` - Django management command
- `backend/auto_expire_runner.py` - Periodic runner script
- `backend/api/views.py` - Modified `complete_session` to handle expired sessions
- `src/components/NotificationCenter.jsx` - Fixed infinite loop bug

### Database Changes

The system uses existing `TestSession` and `TestAttempt` models. When a session expires:

1. Session is marked as `is_expired=True`
2. A `TestAttempt` record is created with saved answers
3. Score is calculated based on correct answers
4. Time taken is set to the full test duration (since it expired)

### Answer Saving

Answers are saved in real-time during the test via the `update_answers` API endpoint. This ensures that even if a student leaves suddenly, their progress up to that point is preserved.

## Testing

To test the auto-expiration:

1. Start a test session
2. Answer some questions (answers are saved automatically)
3. Close the browser or navigate away
4. Wait for the session to expire (or manually run the command)
5. Check that a TestAttempt record was created with the saved answers

## Monitoring

The command outputs logs showing:
- Number of expired sessions found
- Sessions that were auto-completed
- Any errors during processing

Check the Django logs or command output for monitoring.