from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Avg, Count
from api.models import Event, EventReward, User, TestAttempt
import json


class Command(BaseCommand):
    help = 'Distribute rewards for events that have reached their distribution date'


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

            if event.event_type in ['class_rating', 'school_rating']:
                rewards_count = self.distribute_rating_rewards(event, dry_run)
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

    def distribute_rating_rewards(self, event, dry_run=False):
        """Distribute rewards based on ratings (school-wide or class-based)"""
        rewards_distributed = 0

        if event.event_type == 'school_rating':
            # School-wide rating: all students compete together
            rewards_distributed += self.distribute_school_rating_rewards(event, dry_run)
        elif event.event_type == 'class_rating':
            # Class-based rating: each class has its own competition
            rewards_distributed += self.distribute_class_rating_rewards(event, dry_run)

        return rewards_distributed

    def distribute_school_rating_rewards(self, event, dry_run=False):
        """Distribute rewards for school-wide rating events"""
        rewards_distributed = 0

        # Get all students
        students = User.objects.filter(role='student')

        if not students:
            self.stdout.write(
                self.style.WARNING(f'No students found for school rating event {event.title}')
            )
            return 0

        # Calculate ratings for each student
        student_ratings = self.calculate_student_ratings(students)

        # Sort by average score (descending) and take top 3
        student_ratings.sort(key=lambda x: x['average_score'], reverse=True)
        top_students = student_ratings[:3]

        # Distribute rewards
        rewards_distributed += self.award_positions(event, top_students, dry_run, "school-wide")

        return rewards_distributed

    def distribute_class_rating_rewards(self, event, dry_run=False):
        """Distribute rewards for class-based rating events"""
        rewards_distributed = 0

        # Get target class groups
        target_groups = []
        if event.target_class_groups:
            target_groups = [group.strip() for group in event.target_class_groups.split(',') if group.strip()]

        if not target_groups:
            # If no specific classes, treat as school-wide
            self.stdout.write(
                self.style.WARNING(f'No target classes specified for class rating event {event.title}, treating as school-wide')
            )
            return self.distribute_school_rating_rewards(event, dry_run)

        # Process each class separately
        for class_group in target_groups:
            self.stdout.write(
                self.style.SUCCESS(f'Processing class: {class_group}')
            )

            # Get students in this class
            class_students = User.objects.filter(role='student', class_group=class_group)

            if not class_students:
                self.stdout.write(
                    self.style.WARNING(f'No students found in class {class_group}')
                )
                continue

            # Calculate ratings for students in this class
            student_ratings = self.calculate_student_ratings(class_students)

            # Sort by average score (descending) and take top 3
            student_ratings.sort(key=lambda x: x['average_score'], reverse=True)
            top_students = student_ratings[:3]

            # Distribute rewards for this class
            class_rewards = self.award_positions(event, top_students, dry_run, f"class {class_group}")
            rewards_distributed += class_rewards

        return rewards_distributed

    def calculate_student_ratings(self, students):
        """Calculate average scores for a group of students"""
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

        return student_ratings

    def award_positions(self, event, top_students, dry_run, context):
        """Award stars to top students and their entire class for a given context"""
        rewards_distributed = 0

        position_stars = {
            1: event.first_place_stars,
            2: event.second_place_stars,
            3: event.third_place_stars
        }

        # Track which classes have already received rewards to avoid duplicates
        rewarded_classes = set()

        for i, rating_data in enumerate(top_students):
            student = rating_data['student']
            position = i + 1
            stars = position_stars.get(position, 0)

            # Check if reward already exists for this event and student
            existing_reward = EventReward.objects.filter(
                event=event,
                student=student
            ).first()

            if existing_reward:
                self.stdout.write(
                    f'  Reward already exists for {student.name} in {context} (position {position})'
                )
                continue

            # For class-based events, give stars to the entire class
            if 'class' in context.lower():
                class_group = student.class_group
                if class_group and class_group not in rewarded_classes:
                    # Give stars to all students in the winner's class
                    class_students = User.objects.filter(
                        role='student',
                        class_group=class_group
                    )

                    for class_student in class_students:
                        # Check if this student already has a reward for this event
                        existing_class_reward = EventReward.objects.filter(
                            event=event,
                            student=class_student
                        ).first()

                        if existing_class_reward:
                            continue

                        if dry_run:
                            self.stdout.write(
                                self.style.WARNING(
                                    f'  DRY RUN [{context}]: Would give {stars} stars to {class_student.name} '
                                    f'(class reward for {student.name}\'s {position} place)'
                                )
                            )
                        else:
                            # Create reward record for class student
                            reward = EventReward.objects.create(
                                event=event,
                                student=class_student,
                                stars_awarded=stars,
                                position=position if class_student == student else None  # Only winner gets position
                            )

                            # Add stars to class student
                            class_student.stars += stars
                            class_student.save()

                            # Create notification
                            if class_student == student:
                                self.create_event_notification(class_student, event, stars, position, "g'olib")
                            else:
                                self.create_event_notification(class_student, event, stars, None, "sinf mukofoti")

                            rewards_distributed += 1

                    rewarded_classes.add(class_group)

                    if not dry_run:
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'  [{context}] Gave {stars} stars to entire class {class_group} '
                                f'(winner: {student.name}, position {position})'
                            )
                        )
                else:
                    # Class already rewarded, skip
                    continue
            else:
                # For school-wide events, just give to individual winner
                if dry_run:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  DRY RUN [{context}]: Would give {stars} stars to {student.name} '
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

                    # Create notification
                    self.create_event_notification(student, event, stars, position)

                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  [{context}] Gave {stars} stars to {student.name} '
                            f'(position {position}, avg score: {rating_data["average_score"]:.1f}%)'
                        )
                    )

                rewards_distributed += 1

        return rewards_distributed


    def create_event_notification(self, student, event, stars, position=None, reward_type=""):
        """Create a notification for the student (stored in localStorage simulation)"""
        # Since notifications are stored in localStorage on frontend,
        # we'll just log this for now. In a real implementation,
        # you might want to store notifications in the database
        # or send them via email/push notifications

        if position:
            message = f'Siz "{event.title}" tadbirida {position}-o\'rinni egallab, {stars} yulduz yutdingiz!'
        elif reward_type == "sinf mukofoti":
            message = f'Sizning sinfingiz "{event.title}" tadbirida g\'olib bo\'ldi! {stars} yulduz yutdingiz!'
        else:
            message = f'Siz "{event.title}" tadbirida {stars} yulduz yutdingiz!'

        notification = {
            'id': f'event_{event.id}_{student.id}',
            'studentId': student.id,
            'title': '🎉 Tadbir mukofoti!',
            'message': message,
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