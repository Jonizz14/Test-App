from django.core.management.base import BaseCommand
from api.models import StarPackage

class Command(BaseCommand):
    help = 'Create default star packages'

    def handle(self, *args, **options):
        # Default star packages
        star_packages = [
            {
                'stars': 25,
                'original_price': 0.99,
                'discounted_price': 0.49,
                'discount_percentage': 50,
                'is_popular': False,
                'is_active': True,
            },
            {
                'stars': 50,
                'original_price': 1.49,
                'discounted_price': 0.89,
                'discount_percentage': 40,
                'is_popular': False,
                'is_active': True,
            },
            {
                'stars': 100,
                'original_price': 2.49,
                'discounted_price': 1.49,
                'discount_percentage': 40,
                'is_popular': True,
                'is_active': True,
            },
            {
                'stars': 250,
                'original_price': 4.99,
                'discounted_price': 2.99,
                'discount_percentage': 40,
                'is_popular': False,
                'is_active': True,
            },
            {
                'stars': 500,
                'original_price': 7.49,
                'discounted_price': 4.49,
                'discount_percentage': 40,
                'is_popular': False,
                'is_active': True,
            },
            {
                'stars': 1000,
                'original_price': 12.99,
                'discounted_price': 7.99,
                'discount_percentage': 38,
                'is_popular': False,
                'is_active': True,
            },
        ]

        created_count = 0
        for package_data in star_packages:
            package, created = StarPackage.objects.get_or_create(
                stars=package_data['stars'],
                defaults=package_data
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created star package: {package.stars} stars')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Star package already exists: {package.stars} stars')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully processed {len(star_packages)} star packages, created {created_count} new ones')
        )