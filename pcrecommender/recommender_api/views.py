# recommender_api/views.py
from rest_framework import viewsets, permissions, status 
from rest_framework.views import APIView 
from rest_framework.response import Response
from django.contrib.auth.models import User 
from django.utils import timezone 
from datetime import timedelta 

from .models import SavedSpecification, RecommendationRequestLog
from .serializers import AdminUserSerializer, AdminSavedSpecSerializer, SavedSpecificationSerializer 
from .services import get_specs_from_gemini, GEMINI_API_KEY, get_build_explanation_from_gemini 

class SpecsRecommendationView(APIView):
    # ถ้า user login อยู่ อาจจะแนบ user info ไปให้ get_specs_from_gemini (เผื่ออนาคต)
    # permission_classes = [permissions.IsAuthenticatedOrReadOnly] 

    def post(self, request, *args, **kwargs):
        if not GEMINI_API_KEY:
            return Response(
                {"error": "บริการ AI ยังไม่ได้ตั้งค่าอย่างถูกต้อง (API Key Missing)"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        data = request.data
        budget = data.get("budget")
        currency = data.get("currency", "THB")
        user = request.user if request.user.is_authenticated else None

        desired_parts_filtered = {
            key: value for key, value in {
                "cpu": data.get("desired_cpu"),
                "gpu": data.get("desired_gpu"),
                "ram": data.get("desired_ram"),
                "storage_type": data.get("desired_storage_type"),
                "storage_size": data.get("desired_storage_size"),
                "motherboard_chipset": data.get("desired_motherboard_chipset"),
                "psu_wattage": data.get("desired_psu_wattage"),
            }.items() if value
        }

        preferred_games = data.get("preferred_games", [])
        RecommendationRequestLog.objects.create(user=user, request_payload=desired_parts_filtered)
        if budget is None: 
            return Response({"error": "Budget is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            budget_float = float(budget)
            if budget_float <=0: raise ValueError()
        except ValueError:
            return Response({"error": "Invalid budget"}, status=status.HTTP_400_BAD_REQUEST)


        # เก็บ input ของผู้ใช้ไว้เผื่อจะบันทึกเป็น source_prompt_details 
        user_prompt_input = {
            "budget": budget_float,
            "currency": currency,
            "desired_parts": desired_parts_filtered,
            "preferred_games": preferred_games
        }

        recommendations_data = get_specs_from_gemini(
            budget=budget_float,
            currency=currency,
            desired_parts=desired_parts_filtered,
            preferred_games=preferred_games
        )

        if "error" in recommendations_data:
            return Response(recommendations_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 

        # เพิ่ม user_prompt_input เข้าไปใน response เพื่อให้ frontend นำไปใช้ตอน save
        if "recommendations" in recommendations_data:
            recommendations_data["source_prompt_for_saving"] = user_prompt_input

        return Response(recommendations_data, status=status.HTTP_200_OK)


class SavedSpecificationViewSet(viewsets.ModelViewSet):
    serializer_class = SavedSpecificationSerializer
    permission_classes = [permissions.IsAuthenticated] \

    def get_queryset(self):
        """
        ผู้ใช้แต่ละคนจะเห็นเฉพาะสเปคที่ตัวเองบันทึกไว้เท่านั้น
        """
        return SavedSpecification.objects.filter(user=self.request.user).order_by('-saved_at')

class ExplainBuildView(APIView):
    permission_classes = [] # [permissions.IsAuthenticated] สำหรับเปลี่ยนให้ login ก่อน

    def post(self, request, *args, **kwargs):
        if not GEMINI_API_KEY:
            return Response(
                {"error": "บริการ AI ยังไม่ได้ตั้งค่าอย่างถูกต้อง (API Key Missing)"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        selected_build = request.data.get("selected_build")
        original_query = request.data.get("original_query")

        if not selected_build or not isinstance(selected_build, dict):
            return Response({"error": "Missing or invalid 'selected_build' data."}, status=status.HTTP_400_BAD_REQUEST)
        if not original_query or not isinstance(original_query, dict):
            return Response({"error": "Missing or invalid 'original_query' data."}, status=status.HTTP_400_BAD_REQUEST)

        explanation_data = get_build_explanation_from_gemini(selected_build, original_query)

        if "error" in explanation_data:
            return Response(explanation_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(explanation_data, status=status.HTTP_200_OK)
    
class AdminUserViewSet(viewsets.ModelViewSet):
    """
    API endpoint สำหรับ Admin เพื่อจัดการ Users.
    """
    queryset = User.objects.all().order_by('-date_joined') 
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser] 


class AdminSavedSpecViewSet(viewsets.ModelViewSet):
    """
    API endpoint สำหรับ Admin เพื่อจัดการ Saved Specifications.
    Admin สามารถ List และ Delete ได้ (ไม่ควรให้ Admin Create/Update สเปคของ User อื่นโดยตรงผ่าน endpoint นี้)
    """
    queryset = SavedSpecification.objects.select_related('user').all().order_by('-saved_at')
    serializer_class = AdminSavedSpecSerializer
    permission_classes = [permissions.IsAdminUser]
    http_method_names = ['get', 'delete', 'head', 'options'] 

class AdminStatsView(APIView):
    """
    API endpoint สำหรับ Admin เพื่อดึงข้อมูลสถิติเบื้องต้น
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        total_users = User.objects.count()
        total_saved_specs = SavedSpecification.objects.count()

        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = timezone.now().replace(hour=23, minute=59, second=59, microsecond=999999)

        recommendations_today = RecommendationRequestLog.objects.filter(
            timestamp__gte=today_start, timestamp__lte=today_end
        ).count()

        stats_data = {
            "total_users": total_users,
            "total_saved_specs": total_saved_specs,
            "recommendations_today": recommendations_today,
        }
        return Response(stats_data, status=status.HTTP_200_OK)