from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'tests', views.TestViewSet)
router.register(r'questions', views.QuestionViewSet)
router.register(r'attempts', views.TestAttemptViewSet)
router.register(r'feedback', views.FeedbackViewSet)
router.register(r'sessions', views.TestSessionViewSet, basename='testsession')
router.register(r'pricing', views.PricingViewSet)
router.register(r'star-packages', views.StarPackageViewSet)
router.register(r'contact-messages', views.ContactMessageViewSet)
router.register(r'updates', views.SiteUpdateViewSet)
router.register(r'site-settings', views.SiteSettingsViewSet, basename='site-settings')


urlpatterns = [
    path('', include(router.urls)),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]