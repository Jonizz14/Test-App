from django.contrib import admin

from .models import User, Test, Question, TestAttempt, Feedback, TestSession, Pricing, StarPackage, ContactMessage, SiteUpdate, SiteSettings, PremiumPurchase

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'role', 'email', 'is_premium', 'stars')
    list_filter = ('role', 'is_premium')
    search_fields = ('username', 'email', 'display_id')

@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ('title', 'teacher', 'subject', 'difficulty', 'is_active', 'is_premium', 'star_price')
    list_filter = ('subject', 'difficulty', 'is_active', 'is_premium')
    search_fields = ('title', 'subject')

@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ('id', 'updated_at')
    
    def has_add_permission(self, request):
        # Settings should already exist or be created by get_settings
        return not SiteSettings.objects.exists()

admin.site.register(Question)
admin.site.register(TestAttempt)
admin.site.register(Feedback)
admin.site.register(TestSession)
admin.site.register(Pricing)
admin.site.register(StarPackage)
admin.site.register(ContactMessage)
admin.site.register(SiteUpdate)
admin.site.register(PremiumPurchase)
