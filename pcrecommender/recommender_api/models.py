# recommender_api/models.py
from django.db import models
from django.conf import settings # เพื่อ import User model อย่างถูกต้อง
# from django.contrib.auth.models import User # หรือ import แบบนี้ก็ได้

class SavedSpecification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, # อ้างอิงถึง User model ปัจจุบันของ Django
        on_delete=models.CASCADE, # ถ้า User ถูกลบ สเปคที่บันทึกไว้ก็จะถูกลบด้วย
        related_name='saved_specs'
    )
    name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="ชื่อที่ผู้ใช้ตั้งเองสำหรับสเปคนี้ (เช่น 'PC เล่นเกมสุดคุ้ม')"
    )
    # เก็บรายละเอียดสเปคที่ได้จาก Gemini ทั้งหมดเป็น JSON
    # อาจจะเป็น object ของ build เดียว หรือ array ถ้า Gemini แนะนำหลายแบบแล้วผู้ใช้เลือกมา 1
    build_details = models.JSONField(
        help_text="รายละเอียดสเปคคอมพิวเตอร์ที่ได้จาก Gemini (JSON format)"
    )
    # (แนะนำ) เก็บ prompt เดิมที่ใช้สร้างสเปคนี้
    source_prompt_details = models.JSONField(
        null=True, blank=True,
        help_text="รายละเอียด input เดิมของผู้ใช้ (งบ, เกม, ส่วนที่ต้องการ) ที่ใช้สร้างสเปคนี้ (JSON format)"
    )
    user_notes = models.TextField(
        blank=True,
        null=True,
        help_text="บันทึกส่วนตัวของผู้ใช้เกี่ยวกับสเปคนี้"
    )
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-saved_at'] # สเปคที่บันทึกล่าสุดขึ้นก่อน
        # ให้ user คนเดียวบันทึกชื่อสเปคซ้ำกันไม่ได้ (ถ้าต้องการ)
        # unique_together = [['user', 'name']] # แต่ name เป็น optional อาจจะไม่เหมาะ

    def __str__(self):
        display_name = self.name if self.name else f"Spec saved on {self.saved_at.strftime('%Y-%m-%d')}"
        return f"{display_name} (User: {self.user.username})"

class RecommendationRequestLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, # หรือ CASCADE ถ้าต้องการลบ log เมื่อ user ถูกลบ
        null=True, # อนุญาตให้เป็น anonymous request ได้
        blank=True,
        related_name='recommendation_logs'
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    request_payload = models.JSONField(null=True, blank=True) # เก็บ payload ที่ user ส่งมา (งบ, เกม, etc.)
    # (Optional) เก็บ IP address, user agent, etc.
    # ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Recommendation Request Log"
        verbose_name_plural = "Recommendation Request Logs"

    def __str__(self):
        user_str = self.user.username if self.user else "Anonymous"
        return f"Request by {user_str} at {self.timestamp.strftime('%Y-%m-%d %H:%M')}"