# recommender_api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SpecsRecommendationView, SavedSpecificationViewSet, ExplainBuildView, # Views เดิม
    AdminUserViewSet, AdminSavedSpecViewSet, AdminStatsView, # Admin Views/ViewSets ใหม่
    # AdminGeminiSettingsView # ถ้า implement
)

# Router สำหรับ User ทั่วไป
user_router = DefaultRouter()
user_router.register(r'saved-specs', SavedSpecificationViewSet, basename='saved_specification')

# Router สำหรับ Admin (ถ้าต้องการใช้ ViewSet)
admin_router = DefaultRouter()
admin_router.register(r'users', AdminUserViewSet, basename='admin-user')
admin_router.register(r'saved-specs', AdminSavedSpecViewSet, basename='admin-saved-spec')


urlpatterns = [
    # User-facing APIs
    path('recommend-specs/', SpecsRecommendationView.as_view(), name='recommend_specs'),
    path('explain-build/', ExplainBuildView.as_view(), name='explain_build'),
    path('', include(user_router.urls)), # saved-specs ของ user

    # Admin APIs (ควรจะอยู่ภายใต้ prefix ที่มีการตรวจสอบสิทธิ์ Admin ที่เข้มงวด)
    # ตัวอย่างการใช้ prefix /admin/ ภายใน /api/
    path('admin/stats/', AdminStatsView.as_view(), name='admin_stats'),
    # path('admin/settings/gemini/', AdminGeminiSettingsView.as_view(), name='admin_gemini_settings'), # ถ้า implement
    path('admin/', include(admin_router.urls)), # จะสร้าง /api/admin/users/, /api/admin/saved-specs/
]