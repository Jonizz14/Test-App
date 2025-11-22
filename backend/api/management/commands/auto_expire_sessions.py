from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import TestSession, TestAttempt


class Command(BaseCommand):
    help = 'Automatically expire and complete test sessions that have run out of time'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually doing it',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        # Find all expired but not completed sessions
        now = timezone.now()
        expired_sessions = TestSession.objects.filter(
            is_completed=False,
            is_expired=False,
            expires_at__lte=now
        )

        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Found {expired_sessions.count()} expired sessions')
            )
            for session in expired_sessions:
                self.stdout.write(
                    f'  Would expire: {session.session_id} - {session.student.username} - {session.test.title}'
                )
            return

        expired_count = 0
        completed_count = 0

        for session in expired_sessions:
            try:
                # Mark session as expired
                session.mark_expired()
                expired_count += 1

                # Auto-complete the session with saved answers
                self.complete_expired_session(session)
                completed_count += 1

                self.stdout.write(
                    self.style.SUCCESS(
                        f'Auto-completed expired session: {session.session_id} - {session.student.username}'
                    )
                )

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Error processing session {session.session_id}: {str(e)}'
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed {expired_count} expired sessions, '
                f'auto-completed {completed_count} tests'
            )
        )

    def complete_expired_session(self, session):
        """Complete an expired session with the saved answers"""
        # Calculate score based on saved answers
        questions = session.test.questions.all()
        correct_answers = 0
        total_questions = questions.count()

        for question in questions:
            user_answer = session.answers.get(str(question.id), '')
            if user_answer and user_answer.lower().strip() == question.correct_answer.lower().strip():
                correct_answers += 1

        score = (correct_answers / total_questions * 100) if total_questions > 0 else 0

        # Calculate time taken (full time limit since it expired)
        time_taken = session.test.time_limit

        # Create attempt record
        attempt = TestAttempt.objects.create(
            student=session.student,
            test=session.test,
            answers=session.answers,
            score=score,
            time_taken=time_taken
        )

        # Mark session as completed
        session.complete()

        return attempt