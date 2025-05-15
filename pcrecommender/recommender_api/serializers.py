# recommender_api/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User 
from .models import SavedSpecification
# from django.contrib.auth.models import User (ไม่จำเป็นต้อง import โดยตรงถ้าใช้ settings.AUTH_USER_MODEL)

class UserSerializer(serializers.ModelSerializer): # สำหรับแสดงข้อมูล user ทั่วไป (เช่นใน AuthContext)
    class Meta:
        model = User
        fields = ['id', 'pk', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser'] 

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
    
class AdminUserSerializer(serializers.ModelSerializer):
    # คุณสามารถเพิ่ม field หรือปรับแต่งการแสดงผลได้ตามต้องการ
    # เช่น แสดง date_joined, last_login, หรือ group ต่างๆ
    class Meta:
        model = User # หรือ Custom User Model ของคุณ
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'is_active', 'is_staff', 'is_superuser',
                  'date_joined', 'last_login']
        read_only_fields = ['date_joined', 'last_login'] # ไม่ให้แก้ไขผ่าน API โดยตรง

# Serializer สำหรับ SavedSpecification ที่ Admin จะเห็น
class AdminSavedSpecSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField() # แสดง username ของ user เจ้าของ
    build_name_preview = serializers.SerializerMethodField()

    class Meta:
        model = SavedSpecification
        fields = ['id', 'user', 'name', 'build_details',
                  'source_prompt_details', 'user_notes', 'saved_at', 'build_name_preview']
        read_only_fields = ['user', 'build_details', 'source_prompt_details', 'saved_at'] # Admin อาจจะลบได้ แต่ไม่ควรแก้ไขรายละเอียด build โดยตรง

    def get_build_name_preview(self, obj):
        if isinstance(obj.build_details, dict) and obj.build_details.get('build_name'):
            name = obj.build_details.get('build_name', '')
            return name[:50] + '...' if len(name) > 50 else name
        return "-"