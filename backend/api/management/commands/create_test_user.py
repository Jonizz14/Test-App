from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test user with specific credentials'

    def handle(self, *args, **options):
        # Check if test user already exists
        if User.objects.filter(email='example@gmail.com').exists():
            self.stdout.write(
                self.style.WARNING('Test user already exists')
            )
            return

        # Create test user
        test_user = User.objects.create_user(
            username='example@gmail.com',
            email='example@gmail.com',
            password='admin123',
            role='admin',
            name='Test Admin',
            is_staff=True,
        )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created test user: {test_user.username}')
        )
        self.stdout.write(
            self.style.SUCCESS('Login credentials:')
        )
        self.stdout.write(
            self.style.SUCCESS('Email: example@gmail.com')
        )
        self.stdout.write(
            self.style.SUCCESS('Password: admin123')
        )