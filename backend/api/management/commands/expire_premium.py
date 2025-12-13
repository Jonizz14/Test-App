from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import User

class Command(BaseCommand):
    help = 'Expire premium subscriptions that have reached their expiry date'

    def handle(self, *args, **options):
        now = timezone.now()
        expired_users = User.objects.filter(
            is_premium=True,
            premium_expiry_date__lte=now
        )

        count = 0
        for user in expired_users:
            user.is_premium = False
            user.premium_granted_date = None
            user.premium_expiry_date = None
            user.premium_plan = ''
            user.premium_cost = 0
            user.premium_type = 'time_based'
            user.premium_balance = 0
            user.premium_emoji_count = 0

            user.selected_emojis = []
            user.background_gradient = {}  
            user.profile_photo = None 
            user.profile_status = ''   
            user.display_gift = None 

            user.save()
            count += 1
            self.stdout.write(
                self.style.SUCCESS(f'Expired premium for user: {user.username} - cleared all customizations')
            )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully expired premium for {count} users')
        )