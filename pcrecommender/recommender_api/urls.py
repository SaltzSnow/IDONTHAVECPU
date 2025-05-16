# recommender_api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SpecsRecommendationView, SavedSpecificationViewSet, ExplainBuildView, 
    AdminUserViewSet, AdminSavedSpecViewSet, AdminStatsView, 
)

# Router สำหรับ User ทั่วไป
user_router = DefaultRouter()
user_router.register(r'saved-specs', SavedSpecificationViewSet, basename='saved_specification')

# Router สำหรับ Admin 
admin_router = DefaultRouter()
admin_router.register(r'users', AdminUserViewSet, basename='admin-user')
admin_router.register(r'saved-specs', AdminSavedSpecViewSet, basename='admin-saved-spec')


urlpatterns = [
    # User-facing APIs
    path('recommend-specs/', SpecsRecommendationView.as_view(), name='recommend_specs'),
    path('explain-build/', ExplainBuildView.as_view(), name='explain_build'),
    path('', include(user_router.urls)), 

    # Admin APIs 
    path('admin/stats/', AdminStatsView.as_view(), name='admin_stats'),
    path('admin/', include(admin_router.urls)), 
]