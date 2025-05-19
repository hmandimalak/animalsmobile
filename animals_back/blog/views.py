from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import BlogContent, BlogPost
from .serializers import BlogContentSerializer, BlogPostSerializer, BlogPostDetailSerializer

class BlogContentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing blog content sections
    """
    queryset = BlogContent.objects.all().order_by('order')
    serializer_class = BlogContentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'section_type']
    ordering_fields = ['order', 'created_at', 'updated_at']
    
    def get_queryset(self):
        """Allow filtering active sections only"""
        queryset = super().get_queryset()
        is_active = self.request.query_params.get('is_active', None)
        
        if is_active is not None:
            is_active = is_active.lower() == 'true'  # Convert string to boolean
            queryset = queryset.filter(is_active=is_active)
            
        section_type = self.request.query_params.get('section_type', None)
        if section_type:
            queryset = queryset.filter(section_type=section_type)
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def change_order(self, request, pk=None):
        """
        Change the order of a blog section (move up or down)
        """
        section = self.get_object()
        direction = request.data.get('direction', 'up')
        
        if direction == 'up' and section.order > 0:
            # Find the section above this one
            try:
                above_section = BlogContent.objects.filter(order__lt=section.order).order_by('-order')[0]
                # Swap orders
                above_order = above_section.order
                above_section.order = section.order
                section.order = above_order
                above_section.save()
                section.save()
            except IndexError:
                return Response({'detail': 'Already at the top'}, status=400)
                
        elif direction == 'down':
            # Find the section below this one
            try:
                below_section = BlogContent.objects.filter(order__gt=section.order).order_by('order')[0]
                # Swap orders
                below_order = below_section.order
                below_section.order = section.order
                section.order = below_order
                below_section.save()
                section.save()
            except IndexError:
                return Response({'detail': 'Already at the bottom'}, status=400)
        
        return Response({'detail': f'Moved {direction} successfully'})

class BlogPostViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing blog posts
    """
    queryset = BlogPost.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content', 'excerpt']
    ordering_fields = ['created_at', 'updated_at']
    lookup_field = 'slug'  # Use slug instead of id for lookups
    
    def get_serializer_class(self):
        """Use different serializers for list and detail views"""
        if self.action == 'retrieve':
            return BlogPostDetailSerializer
        return BlogPostSerializer
    
    def get_queryset(self):
        """Allow filtering published posts only for public access"""
        queryset = super().get_queryset()
        
        # If not authenticated, only show published posts
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(published=True)
        
        # Filter by published status if specified
        published = self.request.query_params.get('published', None)
        if published is not None:
            published = published.lower() == 'true'
            queryset = queryset.filter(published=published)
            
        return queryset
        
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured blog posts (most recent published posts)"""
        posts = self.get_queryset().filter(published=True)[:5]
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)