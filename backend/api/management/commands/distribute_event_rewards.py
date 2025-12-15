from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Avg, Count
from api.models import Event, EventReward, User, TestAttempt
import json


class Command(BaseCommand):
    help = 'Distribute rewards for events that have reached their distribution date'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually doing it',
        )
        parser.add_argument(
            '--event-id',
            type=int,
            help='Process only specific event ID',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        event_id = options.get('event_id')

        now = timezone.now()

        # Find events that need reward distribution
        events_query = Event.objects.filter(
            is_active=True,
            distribution_date__lte=now
        )

        if event_id:
            events_query = events_query.filter(id=event_id)

        events = events_query.all()

        if not events:
            self.stdout.write(
                self.style.WARNING('No events found that need reward distribution')
            )
            return

        total_rewards_distributed = 0

        for event in events:
            self.stdout.write(
                self.style.SUCCESS(f'Processing event: {event.title}')
            )

            if event.event_type == 'class_rating':
                rewards_count = self.distribute_class_rating_rewards(event, dry_run)
            else:
                self.stdout.write(
                    self.style.WARNING(f'Unknown event type: {event.event_type}')
                )
                continue

            total_rewards_distributed += rewards_count

        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would distribute {total_rewards_distributed} rewards')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully distributed {total_rewards_distributed} rewards')
            )

    def distribute_class_rating_rewards(self, event, dry_run=False):
        """Distribute rewards based on school-wide ratings"""
        rewards_distributed = 0

        # Get all students (school-wide)
        students = User.objects.filter(role='student').all()

        if not students:
            self.stdout.write(
                self.style.WARNING(f'No students found for event {event.title}')
            )
            return 0

        # Calculate ratings for each student
        student_ratings = []

        for student in students:
            # Get student's average score from all attempts
            attempts = TestAttempt.objects.filter(student=student)
            if attempts.exists():
                avg_score = attempts.aggregate(avg_score=Avg('score'))['avg_score'] or 0
                student_ratings.append({
                    'student': student,
                    'average_score': avg_score,
                    'attempt_count': attempts.count()
                })

        # Sort by average score (descending)
        student_ratings.sort(key=lambda x: x['average_score'], reverse=True)

        # Take top 3 positions
        top_students = student_ratings[:3]

        # Distribute rewards for top 3 positions
        position_stars = {
            1: event.first_place_stars,
            2: event.second_place_stars,
            3: event.third_place_stars
        }

        for i, rating_data in enumerate(top_students):
            student = rating_data['student']
            position = i + 1

            # Check if reward already exists
            existing_reward = EventReward.objects.filter(
                event=event,
                student=student
            ).first()

            if existing_reward:
                self.stdout.write(
                    f'  Reward already exists for {student.name} (position {position})'
                )
                continue

            # Get stars for this position
            stars = position_stars.get(position, 0)

            if dry_run:
                self.stdout.write(
                    self.style.WARNING(
                        f'  DRY RUN: Would give {stars} stars to {student.name} '
                        f'(position {position}, avg score: {rating_data["average_score"]:.1f}%)'
                    )
                )
            else:
                # Create reward record
                reward = EventReward.objects.create(
                    event=event,
                    student=student,
                    stars_awarded=stars,
                    position=position
                )

                # Add stars to student
                student.stars += stars
                student.save()

                # Create notification (stored in localStorage on frontend)
                self.create_event_notification(student, event, stars, position)

                self.stdout.write(
                    self.style.SUCCESS(
                        f'  Gave {stars} stars to {student.name} '
                        f'(position {position}, avg score: {rating_data["average_score"]:.1f}%)'
                    )
                )

            rewards_distributed += 1

        return rewards_distributed


    def create_event_notification(self, student, event, stars, position):
        """Create a notification for the student (stored in localStorage simulation)"""
        # Since notifications are stored in localStorage on frontend,
        # we'll just log this for now. In a real implementation,
        # you might want to store notifications in the database
        # or send them via email/push notifications

        notification = {
            'id': f'event_{event.id}_{student.id}',
            'studentId': student.id,
            'title': '🎉 Event mukofoti!',
            'message': f'Siz "{event.title}" tadbirida {position}-o\'rinni egallab, {stars} yulduz yutdingiz!',
            'type': 'event_reward',
            'eventId': event.id,
            'stars': stars,
            'position': position,
            'isRead': False,
            'createdAt': timezone.now().isoformat()
        }

        # In a real implementation, you would store this in the database
        # For now, we'll just log it
        self.stdout.write(
            f'  Created notification for {student.name}: {notification["message"]}'
        )