# recommender_api/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
from .services import get_specs_from_gemini, get_build_explanation_from_gemini, GEMINI_API_KEY # ยังคงใช้ get_specs_from_gemini

from .models import SavedSpecification # Model ใหม่
from .serializers import SavedSpecificationSerializer # Serializer ใหม่

# SpecsRecommendationView ยังคงเดิม (แต่ output ของมันอาจจะถูกนำไป save)
class SpecsRecommendationView(APIView):
    # ถ้า user login อยู่ อาจจะแนบ user info ไปให้ get_specs_from_gemini ด้วยก็ได้ (เผื่ออนาคต)
    # permission_classes = [permissions.IsAuthenticatedOrReadOnly] # หรือ IsAuthenticated ถ้าบังคับ login ก่อนแนะนำ

    def post(self, request, *args, **kwargs):
        if not GEMINI_API_KEY:
            return Response(
                {"error": "บริการ AI ยังไม่ได้ตั้งค่าอย่างถูกต้อง (API Key Missing)"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        data = request.data
        budget = data.get("budget")
        currency = data.get("currency", "THB")

        # ส่วนประกอบที่ผู้ใช้ต้องการ (เป็น optional ทั้งหมด) - ไม่ได้ใช้ local DB แล้วในแผนนี้
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
        # ... (การ validate input ต่างๆ เช่น budget, preferred_games format) ...
        if budget is None: # ตัวอย่างการ validate ง่ายๆ
            return Response({"error": "Budget is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            budget_float = float(budget)
            if budget_float <=0: raise ValueError()
        except ValueError:
            return Response({"error": "Invalid budget"}, status=status.HTTP_400_BAD_REQUEST)


        # --- เก็บ input ของผู้ใช้ไว้เผื่อจะบันทึกเป็น source_prompt_details ---
        user_prompt_input = {
            "budget": budget_float,
            "currency": currency,
            "desired_parts": desired_parts_filtered,
            "preferred_games": preferred_games
        }
        # --------------------------------------------------------------------

        recommendations_data = get_specs_from_gemini(
            budget=budget_float,
            currency=currency,
            # ในแผนใหม่นี้ เราอาจจะไม่ต้องส่ง pre_selected_parts_from_db หรือ additional_desired_parts_raw
            # แต่ส่ง desired_parts_filtered ตรงๆ (ถ้า get_specs_from_gemini ยังรับแบบนั้น)
            # หรือ get_specs_from_gemini ควรรับ user_prompt_input ทั้งหมดไปเลย
            desired_parts=desired_parts_filtered, # หรือ prompt_details=user_prompt_input
            preferred_games=preferred_games
        )

        if "error" in recommendations_data:
            # ... (การจัดการ error เหมือนเดิม) ...
            return Response(recommendations_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR) # หรือ status อื่นๆ

        # --- เพิ่ม user_prompt_input เข้าไปใน response เพื่อให้ frontend นำไปใช้ตอน save ---
        if "recommendations" in recommendations_data:
            recommendations_data["source_prompt_for_saving"] = user_prompt_input
        # -----------------------------------------------------------------------------

        return Response(recommendations_data, status=status.HTTP_200_OK)


# ViewSet สำหรับจัดการ Saved Specifications
class SavedSpecificationViewSet(viewsets.ModelViewSet):
    serializer_class = SavedSpecificationSerializer
    permission_classes = [permissions.IsAuthenticated] # ผู้ใช้ต้อง login ก่อนเท่านั้น

    def get_queryset(self):
        """
        ผู้ใช้แต่ละคนจะเห็นเฉพาะสเปคที่ตัวเองบันทึกไว้เท่านั้น
        """
        return SavedSpecification.objects.filter(user=self.request.user).order_by('-saved_at')

class ExplainBuildView(APIView):
    permission_classes = [] # หรือ [permissions.IsAuthenticated] ถ้าต้องการให้ user login ก่อน

    def post(self, request, *args, **kwargs):
        if not GEMINI_API_KEY:
            return Response(
                {"error": "บริการ AI ยังไม่ได้ตั้งค่าอย่างถูกต้อง (API Key Missing)"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        selected_build = request.data.get("selected_build")
        original_query = request.data.get("original_query") # คือ source_prompt_for_saving จาก frontend

        if not selected_build or not isinstance(selected_build, dict):
            return Response({"error": "Missing or invalid 'selected_build' data."}, status=status.HTTP_400_BAD_REQUEST)
        if not original_query or not isinstance(original_query, dict):
            return Response({"error": "Missing or invalid 'original_query' data."}, status=status.HTTP_400_BAD_REQUEST)

        explanation_data = get_build_explanation_from_gemini(selected_build, original_query)

        if "error" in explanation_data:
            # สามารถปรับปรุงการจัดการ error status code ตรงนี้ได้
            return Response(explanation_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(explanation_data, status=status.HTTP_200_OK)