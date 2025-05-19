from rest_framework import serializers
from accounts.serializers import UserSerializer
from .models import BlogContent, BlogPost

class BlogContentSerializer(serializers.ModelSerializer):
    """
    Serializer for blog content sections
    """
    section_type_display = serializers.CharField(source='get_section_type_display', read_only=True)
    
    class Meta:
        model = BlogContent
        fields = [
            'id', 'section_type', 'section_type_display', 'title', 
            'content', 'image', 'is_active', 'order', 
            'created_at', 'updated_at'
        ]

class BlogPostSerializer(serializers.ModelSerializer):
    """
    Serializer for blog posts list view (with less detail)
    """
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'author', 'excerpt',
            'featured_image', 'published', 'created_at', 'updated_at'
        ]
        read_only_fields = ['slug']  # Slug is auto-generated

class BlogPostDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for blog post detail view (with full content)
    """
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'author', 'content', 
            'excerpt', 'featured_image', 'published', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['slug']