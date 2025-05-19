from django.urls import path, include
from .views import GoogleLoginView
from .views import (
    RegisterView, MyTokenObtainPairView, get_user_profile, password_reset_confirm, 
    password_reset_request, update_user_profile, user_list, user_detail,contact_form,
)
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', MyTokenObtainPairView.as_view(), name='login'),
    path('password-reset/', password_reset_request, name='password-reset'),
    path('password-reset/confirm/', password_reset_confirm, name='password-reset-confirm'),
    path('profile/', get_user_profile, name='get_user_profile'),
    
    path('profile/update/', update_user_profile, name='update_user_profile'),
    path('users/', user_list, name='user-list'),
    path('users/<int:pk>/', user_detail, name='user-detail'),


    # Google OAuth2 Routes
    path('google/', GoogleLoginView.as_view(), name='google_login'),  # Google login endpoint

    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),


    # Include Django Allauth and dj-rest-auth URLs
    path('', include('dj_rest_auth.urls')),
    path('registration/', include('dj_rest_auth.registration.urls')),
    path('allauth/', include('allauth.urls')),  # Social login redirect handling


    path('contact/', contact_form, name='contact_form'),

]