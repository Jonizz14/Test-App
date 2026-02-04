from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0046_alter_user_role'),
    ]

    operations = [
        migrations.AddField(
            model_name='sitesettings',
            name='header_time',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='sitesettings',
            name='header_weather',
            field=models.BooleanField(default=True),
        ),
    ]
