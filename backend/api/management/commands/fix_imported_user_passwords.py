from django.core.management.base import BaseCommand
from api.models import User

class Command(BaseCommand):
    help = 'Fix passwords for imported users to match their display_id'

    def handle(self, *args, **options):
        # Find imported users (those with created_by_admin set)
        imported_users = User.objects.filter(created_by_admin__isnull=False, role__in=['student', 'teacher'])

        fixed_count = 0
        for user in imported_users:
            # Set password to display_id
            user.set_password(user.display_id)
            user.save()
            fixed_count += 1
            self.stdout.write(f'Fixed password for user: {user.username}')

        self.stdout.write(self.style.SUCCESS(f'Successfully fixed passwords for {fixed_count} imported users'))