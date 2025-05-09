# recommender_api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SpecsRecommendationView, SavedSpecificationViewSet, ExplainBuildView 

router = DefaultRouter()
router.register(r'saved-specs', SavedSpecificationViewSet, basename='saved_specification')

urlpatterns = [
    path('recommend-specs/', SpecsRecommendationView.as_view(), name='recommend_specs'),
    path('explain-build/', ExplainBuildView.as_view(), name='explain_build'),
    path('', include(router.urls)), # รวม URLs สำหรับ saved-specs
]