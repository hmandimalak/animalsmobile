from django.conf import settings
from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


#Register Serializer


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'nom', 'prenom', 'email', 'telephone', 'role', 'adresse', 'password', 'profilepicture']
        extra_kwargs = {'password': {'write_only': True}}
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.profilepicture:
            request = self.context.get('request')
            if request is not None:
                representation['profilepicture'] = request.build_absolute_uri(instance.profilepicture.url)
            else:
                representation['profilepicture'] = instance.profilepicture.url
        return representation
    
    def create(self, validated_data):
        # Remove profilepicture from validated_data if it exists
        profilepicture = validated_data.pop('profilepicture', None)
        
        # Create user without profilepicture first
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            nom=validated_data['nom'],
            prenom=validated_data['prenom'],
            telephone=validated_data['telephone'],
            role=validated_data['role'],
            adresse=validated_data['adresse']
        )
        
        # Add profilepicture if provided
        if profilepicture:
            user.profilepicture = profilepicture
            user.save()
            
        return user


#Login Serializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims to the JWT token
        token['email'] = user.email
        token['nom'] = user.nom
        token['prenom'] = user.prenom
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user_id to the response data (not just the token)
        data['user_id'] = self.user.id

        return data

 
 
 