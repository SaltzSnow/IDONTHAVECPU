# Generated by Django 4.2.21 on 2025-05-15 17:57

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('recommender_api', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='RecommendationRequestLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('request_payload', models.JSONField(blank=True, null=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='recommendation_logs', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Recommendation Request Log',
                'verbose_name_plural': 'Recommendation Request Logs',
                'ordering': ['-timestamp'],
            },
        ),
    ]
