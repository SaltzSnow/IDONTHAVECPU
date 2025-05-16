# recommender_api/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User 
from .models import SavedSpecification

class UserSerializer(serializers.ModelSerializer): 
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
            'user',
            'name',
            'build_details',
            'source_prompt_details',
            'user_notes',
            'saved_at'
        ]
        read_only_fields = ['user', 'saved_at'] 

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'is_active', 'is_staff', 'is_superuser',
                  'date_joined', 'last_login']
        read_only_fields = ['date_joined', 'last_login'] 

class AdminSavedSpecSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField() 
    build_name_preview = serializers.SerializerMethodField()

    class Meta:
        model = SavedSpecification
        fields = ['id', 'user', 'name', 'build_details',
                  'source_prompt_details', 'user_notes', 'saved_at', 'build_name_preview']
        read_only_fields = ['user', 'build_details', 'source_prompt_details', 'saved_at']

    def get_build_name_preview(self, obj):
        if isinstance(obj.build_details, dict) and obj.build_details.get('build_name'):
            name = obj.build_details.get('build_name', '')
            return name[:50] + '...' if len(name) > 50 else name
        return "-"