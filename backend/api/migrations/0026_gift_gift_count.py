from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0025_gift_rarity_user_display_gift'),
    ]

    operations = [
        migrations.AddField(
            model_name='gift',
            name='gift_count',
            field=models.IntegerField(default=0, help_text='Total available quantity of this gift (0 = unlimited)'),
        ),
    ]