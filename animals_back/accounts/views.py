# views.py
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.models import User
from django.core.mail import send_mail
import json

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from .serializers import UserSerializer, MyTokenObtainPairSerializer
from .models import Utilisateur,CustomAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.hashers import check_password, make_password



import logging

logger = logging.getLogger(__name__)

class RegisterView(APIView):
    authentication_classes = []  # No authentication required for registration
    parser_classes = [MultiPartParser, FormParser]  # Add these parsers for file uploads

    def post(self, request):
        serializer = UserSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    authentication_classes = []  # No authentication required for login

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import requests
import logging
import time
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()  # Use the custom user model

class GoogleLoginView(APIView):
    def post(self, request):
        try:
            logger.info("Received request data: %s", request.data)
            
            # Get the ID token from the request
            id_token_str = request.data.get('id_token')
            access_token = request.data.get('access_token')
            
            logger.info("ID token: %s", id_token_str)
            logger.info("Access token: %s", access_token)
            
            if not id_token_str:
                logger.error("No ID token provided")
                return Response(
                    {'error': 'No ID token provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify the ID token with increased clock skew tolerance
            try:
                idinfo = id_token.verify_oauth2_token(
                    id_token_str,
                    google_requests.Request(),
                    settings.GOOGLE_CLIENT_ID,
                    clock_skew_in_seconds=30  # Allow up to 30 seconds of clock skew
                )
                
                logger.info("ID info verified: %s", idinfo)
                
                # Log token timestamps for debugging
                logger.info("Token issued at: %s", idinfo.get('iat'))
                logger.info("Token expires at: %s", idinfo.get('exp'))
                logger.info("Current server time: %s", int(time.time()))
                
            except Exception as e:
                logger.error("Token verification failed: %s", str(e))
                return Response(
                    {'error': f'Token verification failed: {str(e)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Extract user information
            email = idinfo['email']
            
            # Check if user exists
            try:
                user = User.objects.get(email=email)
                created = False
            except User.DoesNotExist:
                # User doesn't exist, create a new one with all required fields
                created = True
                user = User.objects.create_user(
                    email=email,
                    # Set password to None or random string since user is logging in with Google
                    password=None,  
                    # Extract name from Google profile or use email as fallback
                    nom=idinfo.get('family_name', email.split('@')[0]),
                    prenom=idinfo.get('given_name', ''),
                    telephone='',  # Set default empty value
                    role='Proprietaire',  # Set default role
                    adresse=''  # Set default empty value
                )
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Prepare user data for response
            user_data = {
                'email': user.email,
                'name': f"{user.prenom} {user.nom}".strip(),
            }
            
            # Add Google profile picture if available
            if 'picture' in idinfo:
                user_data['image'] = idinfo['picture']
                
                # Optionally, you can save the Google profile picture to the user's profile
                # if created and not user.profilepicture:
                #    # You'd need to implement logic to download and save the image
            
            return Response({
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': user_data
            })
        
        except Exception as e:
            logger.error("Unexpected error: %s", str(e))
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

@api_view(['POST'])
def password_reset_request(request):
    authentication_classes = []  # No authentication required for password reset
    email = request.data.get('email')
    user = User.objects.filter(email=email).first()
    if not user:
        return Response({"error": "User with this email not found"}, status=status.HTTP_400_BAD_REQUEST)

    token = default_token_generator.make_token(user)
    reset_link = f"http://localhost:3000/reset?token={token}&email={email}"
    
    logger.info(f"Sending password reset email to {email} with link {reset_link}")
    
    try:
        send_mail(
            'Password Reset Request',
            f'Click the link to reset your password: {reset_link}',
            settings.EMAIL_HOST_USER,
            [email],
            fail_silently=False,
        )
    except Exception as e:
        return Response({"error": f"Email sending failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({"message": "Check your email for the reset link"}, status=status.HTTP_200_OK)

@api_view(['POST'])
def password_reset_confirm(request):
    authentication_classes = []  # No authentication required for password reset confirmation
    token = request.data.get('token')
    email = request.data.get('email')
    password = request.data.get('password')
    confirm_password = request.data.get('confirm_password')
    
    if password != confirm_password:
        return Response({"error": "Passwords do not match"}, status=status.HTTP_400_BAD_REQUEST)
    
    user = get_object_or_404(User, email=email)
    if not default_token_generator.check_token(user, token):
        return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(password)
    user.save()

    return Response({"message": "Password reset successful"}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    authentication_classes = [CustomAuthentication]
    user = request.user
    
    # Always return null for profilepicture if it doesn't exist
    profile_picture = None
    if hasattr(user, 'profilepicture') and user.profilepicture and hasattr(user.profilepicture, 'url'):
        profile_picture = request.build_absolute_uri(user.profilepicture.url)
    
    return Response({
        "nom": user.nom,
        "prenom": user.prenom,
        "email": user.email,
        "telephone": user.telephone,
        "adresse": user.adresse,
        "role": user.role,
        "profilepicture": profile_picture,
    })

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    authentication_classes = [CustomAuthentication]
    user = request.user

    # Vérification des mots de passe
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')

    if current_password or new_password:
        if not user.check_password(current_password):
            return Response({"message": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)
        if not new_password:
            return Response({"message": "New password cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)
    
        user.set_password(new_password)

    # Mise à jour des autres champs
    user.nom = request.data.get('nom', user.nom)
    user.prenom = request.data.get('prenom', user.prenom)
    user.email = request.data.get('email', user.email)
    user.telephone = request.data.get('telephone', user.telephone)
    user.adresse = request.data.get('adresse', user.adresse)

    if 'profilepicture' in request.FILES:
        user.profilepicture = request.FILES['profilepicture']

    user.save()
    serializer = UserSerializer(user, context={'request': request})

    return Response(serializer.data, status=status.HTTP_200_OK)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_detail(request, pk):
    authentication_classes = [CustomAuthentication]
    user = get_object_or_404(Utilisateur, pk=pk)
    serializer = UserSerializer(user)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_list(request):
    authentication_classes = [CustomAuthentication]
    users = Utilisateur.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)
@api_view(['POST'])
def contact_form(request):
    """
    API endpoint to handle contact form submissions.
    """
    try:
        data = json.loads(request.body)
        name = data.get('name', '')
        email = data.get('email', '')
        message = data.get('message', '')
        
        # Validate data
        if not all([name, email, message]):
            return Response(
                {'error': 'Tous les champs sont obligatoires'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Send email
        subject = f'Nouvelle question de {name}'
        email_message = f"""
        Nom: {name}
        Email: {email}
        
        Message:
        {message}
        """
        
        send_mail(
            subject=subject,
            message=email_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.DEFAULT_FROM_EMAIL],  # Define this in settings.py
            fail_silently=False,
        )
        
        # Send confirmation email to user
        send_mail(
            subject='Nous avons bien reçu votre message',
            message=f"""
            Bonjour {name},
            
            Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.
            
            Cordialement,
            L'équipe du refuge
            """,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        
        return Response({'message': 'Message envoyé avec succès'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
