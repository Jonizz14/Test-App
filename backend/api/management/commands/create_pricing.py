from django.core.management.base import BaseCommand
from api.models import Pricing

class Command(BaseCommand):
    help = 'Create default pricing plans'

    def handle(self, *args, **options):
        # Default pricing plans
        pricing_plans = [
            {
                'plan_type': 'week',
                'original_price': 5.99,
                'discounted_price': 2.99,
                'discount_percentage': 50,
                'is_active': True,
            },
            {
                'plan_type': 'month',
                'original_price': 19.99,
                'discounted_price': 9.99,
                'discount_percentage': 50,
                'is_active': True,
            },
            {
                'plan_type': 'year',
                'original_price': 199.99,
                'discounted_price': 49.99,
                'discount_percentage': 75,
                'is_active': True,
            },
        ]

        created_count = 0
        for plan_data in pricing_plans:
            plan, created = Pricing.objects.get_or_create(
                plan_type=plan_data['plan_type'],
                defaults=plan_data
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created pricing plan: {plan.get_plan_type_display()}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Pricing plan already exists: {plan.get_plan_type_display()}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully processed {len(pricing_plans)} pricing plans, created {created_count} new ones')
        )