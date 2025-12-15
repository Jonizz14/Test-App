from django.core.management.base import BaseCommand
from api.models import Event, EventReward


class Command(BaseCommand):
    help = 'Delete all events and their associated data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion of all events',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    'This will delete ALL events and event rewards. '
                    'Use --confirm to proceed.'
                )
            )
            self.stdout.write(
                self.style.WARNING(
                    'Note: Stars awarded through events will NOT be automatically revoked.'
                )
            )
            return

        # Count what will be deleted
        event_count = Event.objects.count()
        reward_count = EventReward.objects.count()

        self.stdout.write(
            self.style.WARNING(
                f'Will delete {event_count} events and {reward_count} event rewards.'
            )
        )

        # Delete event rewards first (due to foreign key constraints)
        EventReward.objects.all().delete()
        self.stdout.write(
            self.style.SUCCESS(f'Deleted {reward_count} event rewards.')
        )

        # Delete events
        Event.objects.all().delete()
        self.stdout.write(
            self.style.SUCCESS(f'Deleted {event_count} events.')
        )

        self.stdout.write(
            self.style.SUCCESS('All events and event rewards have been deleted.')
        )