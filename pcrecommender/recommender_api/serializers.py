# recommender_api/serializers.py
from rest_framework import serializers
from .models import SavedSpecification
# from django.contrib.auth.models import User (ไม่จำเป็นต้อง import โดยตรงถ้าใช้ settings.AUTH_USER_MODEL)

class SavedSpecificationSerializer(serializers.ModelSerializer):
    # (Optional) ถ้าต้องการแสดง username ของ user ใน response
    # user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = SavedSpecification
        fields = [
            'id',
            'user', # จะถูก set อัตโนมัติใน view ไม่ต้องส่งมาจาก client ตอน create
            'name',
            'build_details',
            'source_prompt_details',
            'user_notes',
            'saved_at'
        ]
        read_only_fields = ['user', 'saved_at'] # user จะถูก set จาก request.user

    def create(self, validated_data):
        # ตั้งค่า user โดยอัตโนมัติเป็น user ที่กำลัง login อยู่
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)