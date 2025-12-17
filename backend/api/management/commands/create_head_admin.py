from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Create head admin user with specific credentials'

    def handle(self, *args, **options):
        # Check if head admin user already exists
        if User.objects.filter(username='headadmin@test.com').exists():
            self.stdout.write(
                self.style.WARNING('Head admin user already exists')
            )
            return

        # Create head admin user
        head_admin = User.objects.create_user(
            username='headadmin@test.com',
            email='headadmin@test.com',
            password='headadmin123',
            role='head_admin',
            name='Head Administrator',
            is_staff=True,  # Allow access to admin interface if needed
        )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created head admin user: {head_admin.username}')
        )
        self.stdout.write(
            self.style.SUCCESS('Login credentials:')
        )
        self.stdout.write(
            self.style.SUCCESS('Email: headadmin@test.com')
        )
        self.stdout.write(
            self.style.SUCCESS('Password: headadmin123')
        )