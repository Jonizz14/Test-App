from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Create seller user with specific credentials'

    def handle(self, *args, **options):
        # Check if seller user already exists
        if User.objects.filter(username='sellerkatya2010@test.com').exists():
            self.stdout.write(
                self.style.WARNING('Seller user already exists')
            )
            return

        # Create seller user
        seller = User.objects.create_user(
            username='sellerkatya2010@test.com',
            email='sellerkatya2010@test.com',
            password='sellerkatya2010@test.com',
            role='seller',
            name='Katya Seller',
            is_staff=True,  # Allow access to admin interface if needed
        )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created seller user: {seller.username}')
        )