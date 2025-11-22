# Generated migration for TestSession model
from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_question_image'),
    ]

    operations = [
        migrations.CreateModel(
            name='TestSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_id', models.CharField(max_length=100, unique=True, help_text='Unique session identifier')),
                ('test', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sessions', to='api.test')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='test_sessions', to=settings.AUTH_USER_MODEL)),
                ('started_at', models.DateTimeField(help_text='When the test session started')),
                ('expires_at', models.DateTimeField(help_text='When the test session expires')),
                ('completed_at', models.DateTimeField(blank=True, null=True, help_text='When the test was completed')),
                ('answers', models.JSONField(default=dict, help_text='Student answers during the session')),
                ('is_completed', models.BooleanField(default=False, help_text='Whether the test session is completed')),
                ('is_expired', models.BooleanField(default=False, help_text='Whether the test session has expired')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='testsession',
            index=models.Index(fields=['student', 'test'], name='api_testsess_student__test_id_8b0b5f_idx'),
        ),
        migrations.AddIndex(
            model_name='testsession',
            index=models.Index(fields=['session_id'], name='api_testsess_session__b0dba1_idx'),
        ),
    ]