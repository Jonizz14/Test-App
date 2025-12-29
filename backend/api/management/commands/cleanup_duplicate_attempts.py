from django.core.management.base import BaseCommand
from django.db.models import Max
from api.models import TestAttempt

class Command(BaseCommand):
    help = 'Clean up duplicate test attempts, keeping only the latest attempt for each student-test combination'

    def handle(self, *args, **options):
        duplicate_count = 0
        
        # Find all student-test combinations that have multiple attempts
        from django.db.models import Count
        duplicates = TestAttempt.objects.values('student', 'test').annotate(
            attempt_count=Count('id')
        ).filter(attempt_count__gt=1)
        
        self.stdout.write(
            self.style.WARNING(
                f'Found {len(duplicates)} student-test combinations with duplicate attempts'
            )
        )
        
        # Process each duplicate combination
        for combo in duplicates:
            student = combo['student']
            test = combo['test']
            
            # Get all attempts for this combination, ordered by submission time (newest first)
            attempts = list(TestAttempt.objects.filter(
                student=student, 
                test=test
            ).order_by('-submitted_at', '-id'))
            
            # Keep the first (newest) attempt, delete the rest
            attempts_to_delete = attempts[1:]
            
            count = len(attempts_to_delete)
            if count > 0:
                self.stdout.write(
                    self.style.WARNING(
                        f'Deleting {count} duplicate attempts for student {student}, test {test}'
                    )
                )
                
                # Show details of what will be deleted
                for attempt in attempts_to_delete:
                    self.stdout.write(
                        f'  - ID: {attempt.id}, Submitted: {attempt.submitted_at}'
                    )
                
                # Delete the attempts
                ids_to_delete = [a.id for a in attempts_to_delete]
                TestAttempt.objects.filter(id__in=ids_to_delete).delete()
                duplicate_count += count
        
        if duplicate_count > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully cleaned up {duplicate_count} duplicate attempts'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('No duplicate attempts found')
            )