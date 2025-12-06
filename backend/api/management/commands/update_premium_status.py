from django.core.management.base import BaseCommand
from api.models import User

class Command(BaseCommand):
    help = 'Update premium status for all students based on their average score'

    def handle(self, *args, **options):
        students = User.objects.filter(role='student')
        updated_count = 0

        for student in students:
            attempts = student.attempts.all()
            if attempts.exists():
                avg_score = sum(attempt.score for attempt in attempts) / attempts.count()
            else:
                avg_score = 0

            self.stdout.write(
                f'{student.name}: {attempts.count()} attempts, avg_score={avg_score:.2f}, current_premium={student.is_premium}'
            )

            old_status = student.is_premium
            student.update_premium_status()
            if student.is_premium != old_status:
                student.save()
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Updated {student.name}: premium {"granted" if student.is_premium else "revoked"}'
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated premium status for {updated_count} students')
        )