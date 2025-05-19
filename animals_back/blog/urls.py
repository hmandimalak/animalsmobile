from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'blog'

router = DefaultRouter()
router.register(r'blog-content', views.BlogContentViewSet, basename='blog-content')
router.register(r'blog-posts', views.BlogPostViewSet, basename='blog-post')

urlpatterns = [
    path('', include(router.urls)),
]