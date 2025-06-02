from datetime import date, timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Animal, DemandeEvenementMarche, DemandeGarde, DemandeAdoption, EvenementMarcheChien,Notification,Adoption
from .serializers import AnimalSerializer, DemandeEvenementMarcheSerializer, DemandeGardeSerializer, DemandeAdoptionSerializer, EvenementMarcheChienSerializer,NotificationSerializer,AdoptionSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework import viewsets
from django.db.models import Q
from django.http import JsonResponse
from rest_framework import generics
from rest_framework.permissions import AllowAny
    




class AnimalListCreateView(APIView):
    permission_classes = [IsAuthenticated]  # Ensure the user is authenticated
    parser_classes = [MultiPartParser, FormParser]
    def post(self, request):
        # First, create the animal
        animal_serializer = AnimalSerializer(data=request.data)
        if animal_serializer.is_valid():
            print(request)
            animal = animal_serializer.save()

            # Now, create the corresponding "Demande de Garde" (Guard Request)
            demande_garde_data = {
                'animal': animal.id,
                'utilisateur': request.user.id,
                'statut': 'En attente',
                'message': request.data.get('message', ''),
                'type_garde': animal.type_garde,
                'image': animal.image  # Copy the image from Animal
            }
            # after demande_garde_data = { … } and before serializer = DemandeGardeSerializer(...)
            if demande_garde_data['type_garde'] == 'Temporaire':
                demande_garde_data['date_reservation'] = request.data.get('date_reservation')
                demande_garde_data['date_fin']         = request.data.get('date_fin')



            #Pass the request context to the serializer
            demande_garde_serializer = DemandeGardeSerializer(data=demande_garde_data, context={'request': request})
            if demande_garde_serializer.is_valid():
                # Save the "Demande de Garde" to the database
                demande_garde_serializer.save()

                # Return both the animal and the guard request details
                return Response({
                    'animal': animal_serializer.data,
                    'demande_garde': demande_garde_serializer.data
                }, status=status.HTTP_201_CREATED)

            # If there are errors in the guard request creation, return them
            return Response(demande_garde_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # If there are errors in the animal creation, return them
        return Response(animal_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AnimalDetailView(APIView):
    def get(self, request, pk):
        animal = get_object_or_404(Animal, pk=pk)
        serializer = AnimalSerializer(animal)
        return Response(serializer.data)

    def put(self, request, pk):
        animal = get_object_or_404(Animal, pk=pk)
        serializer = AnimalSerializer(animal, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        animal = get_object_or_404(Animal, pk=pk)
        animal.delete()
        return Response({"message": "animal deleted"}, status=status.HTTP_204_NO_CONTENT)


# Gestion des demandes de garde
class DemandeGardeListCreateView(APIView):
    def get(self, request):
        demandes = DemandeGarde.objects.all()
        serializer = DemandeGardeSerializer(demandes, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DemandeGardeSerializer(data=request.data)
        if serializer.is_valid():
            # Automatically assign the logged-in user to the request
            serializer.save(utilisateur=request.user)  
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    



# Gestion des demandes d'adoption
class DemandeAdoptionListCreateView(APIView):
    def get(self, request):
        demandes = DemandeAdoption.objects.all()
        serializer = DemandeAdoptionSerializer(demandes, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DemandeAdoptionSerializer(data=request.data)
        if serializer.is_valid():
            # Automatically assign the logged-in user to the request
            serializer.save(utilisateur=request.user)  
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    



class DemandeAdoptionDetailView(APIView):
    def get(self, request, pk):
        demande = get_object_or_404(DemandeAdoption, pk=pk)
        serializer = DemandeAdoptionSerializer(demande)
        return Response(serializer.data)

    def put(self, request, pk):
        demande = get_object_or_404(DemandeAdoption, pk=pk)
        serializer = DemandeAdoptionSerializer(demande, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        demande = get_object_or_404(DemandeAdoption, pk=pk)
        demande.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

class AnimalAdminDefinitiveListView(APIView):
    parser_classes = [MultiPartParser, FormParser]  # Enable file parsing

    def get(self, request):
        # List all animals in the system
        animals = Animal.objects.filter(type_garde='Définitive',disponible_pour_adoption=True)  # Use the exact value from choices
        serializer = AnimalSerializer(animals, many=True)
        #print("test",serializer.data)  
        return Response(serializer.data)

class AnimalDetailView(APIView):
    def get(self, request, pk):
        try:
            animal = Animal.objects.get(pk=pk)
            print("test", animal.image)
        except Animal.DoesNotExist:
            return Response({"error": "Animal not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = AnimalSerializer(animal)
        return Response(serializer.data)

class DemandeAdoptionAPIView(APIView):
    """API view for users to create and view their adoption requests"""
    
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """Automatically create an adoption request for the logged-in user"""
        # Create a new adoption request and set the logged-in user as the requester
        serializer = DemandeAdoptionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(utilisateur=request.user)  # Associate the logged-in user
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Animal, DemandeGarde, DemandeAdoption,Notification
from .serializers import AnimalSerializer, DemandeGardeSerializer, DemandeAdoptionSerializer,NotificationSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import viewsets



class AnimalDetailView(APIView):
    def get(self, request, pk):
        animal = get_object_or_404(Animal, pk=pk)
        serializer = AnimalSerializer(animal)
        return Response(serializer.data)

    def put(self, request, pk):
        animal = get_object_or_404(Animal, pk=pk)
        serializer = AnimalSerializer(animal, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        animal = get_object_or_404(Animal, pk=pk)
        animal.delete()
        return Response({"message": "animal deleted"}, status=status.HTTP_204_NO_CONTENT)


# Gestion des demandes de garde
class DemandeGardeListCreateView(APIView):
    parser_classes = [JSONParser, MultiPartParser, FormParser]  # <-- JSONParser ajouté
    permission_classes = [IsAuthenticated]
    def get(self, request):
        demandes = DemandeGarde.objects.all()
        serializer = DemandeGardeSerializer(demandes, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DemandeGardeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    



# Gestion des demandes d'adoption
class DemandeAdoptionListCreateView(APIView):
    def get(self, request):
        demandes = DemandeAdoption.objects.all()
        serializer = DemandeAdoptionSerializer(demandes, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DemandeAdoptionSerializer(data=request.data)
        if serializer.is_valid():
            # Automatically assign the logged-in user to the request
            serializer.save(utilisateur=request.user)  
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    



class DemandeAdoptionDetailView(APIView):
    def get(self, request, pk):
        demande = get_object_or_404(DemandeAdoption, pk=pk)
        serializer = DemandeAdoptionSerializer(demande)
        return Response(serializer.data)

    def put(self, request, pk):
        demande = get_object_or_404(DemandeAdoption, pk=pk)
        serializer = DemandeAdoptionSerializer(demande, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        demande = get_object_or_404(DemandeAdoption, pk=pk)
        demande.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

class AnimalAdminDefinitiveListView(APIView):
    parser_classes = [MultiPartParser, FormParser]  # Enable file parsing

    def get(self, request):
        # List all animals in the system
        animals = Animal.objects.filter(type_garde='Définitive',disponible_pour_adoption=True)  # Use the exact value from choices
        serializer = AnimalSerializer(animals, many=True)
        #print("test",serializer.data)  
        return Response(serializer.data)

class AnimalDetailView(APIView):
    def get(self, request, pk):
        try:
            animal = Animal.objects.get(pk=pk)
            print("test", animal.image)
        except Animal.DoesNotExist:
            return Response({"error": "Animal not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = AnimalSerializer(animal)
        return Response(serializer.data)

class DemandeAdoptionAPIView(APIView):
    """API view for users to create and view their adoption requests"""
    
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """Automatically create an adoption request for the logged-in user"""
        serializer = DemandeAdoptionSerializer(data=request.data, context={'request': request})  # Pass the request context
        if serializer.is_valid():
            serializer.save(utilisateur=request.user)  # Associate the logged-in user
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class NotificationView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        notifications = Notification.objects.filter(utilisateur=request.user, lu=False)
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)
class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            notification = Notification.objects.get(id=pk, utilisateur=request.user)
            notification.lu = True  # Mark as read
            notification.save()
            return Response({"message": "Notification marked as read"}, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found"}, status=status.HTTP_404_NOT_FOUND)
        
def search_animals(request):
    query = request.GET.get('query', '')
    animal_type = request.GET.get('type', '')
    species = request.GET.get('species', '')
    age = request.GET.get('age', '')
    sexe = request.GET.get('sexe', '')

    # Build the query
    filters = Q()
    if query:
        filters &= Q(nom__icontains=query)
    if animal_type:
        filters &= Q(espece__iexact=animal_type)
    if species:
        filters &= Q(race__iexact=species)
    if sexe:
        filters &= Q(sexe=sexe)
    if age:
        # Age filtering logic - using date calculation
        from datetime import date, timedelta
        today = date.today()
        
        if age == 'puppy':  # Less than 1 year
            date_limit = today - timedelta(days=365)
            filters &= Q(date_naissance__gt=date_limit)
        elif age == 'young':  # 1-3 years
            date_min = today - timedelta(days=3*365)
            date_max = today - timedelta(days=365)
            filters &= Q(date_naissance__lte=date_max, date_naissance__gt=date_min)
        elif age == 'adult':  # 3-8 years
            date_min = today - timedelta(days=8*365)
            date_max = today - timedelta(days=3*365)
            filters &= Q(date_naissance__lte=date_max, date_naissance__gt=date_min)
        elif age == 'senior':  # 8+ years
            date_limit = today - timedelta(days=8*365)
            filters &= Q(date_naissance__lte=date_limit)

    # Fetch filtered animals
    animals = Animal.objects.filter(filters, disponible_pour_adoption=True, type_garde='Définitive')
    animals = AnimalSerializer(animals, many=True).data
    return JsonResponse(list(animals), safe=False)

def get_animal_by_id(request, animal_id):
    """
    Get a single animal by ID
    """
    try:
        animal = get_object_or_404(Animal, id=animal_id, disponible_pour_adoption=True, type_garde='Définitive')
        animal_data = AnimalSerializer(animal).data
        return JsonResponse(animal_data)
    except Animal.DoesNotExist:
        return JsonResponse({'error': 'Animal not found'}, status=404)
class UserAcceptedTemporaryAnimalsView(generics.ListAPIView):
    serializer_class = AnimalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Animal.objects.filter(
            garderie__utilisateur=user,
            garderie__type_garde='Temporaire',
        ).distinct()
    
class UserAcceptedDefinitiveAnimalsView(generics.ListAPIView):
    serializer_class = AnimalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Animal.objects.filter(
            garderie__utilisateur=user,
            type_garde='Définitive'
        ).distinct()
class UserAcceptedAdoptionAnimalsView(generics.ListAPIView):
    serializer_class = AnimalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Get all animals that were adopted by the user via the Adoption model
        return Animal.objects.filter(adoptions__utilisateur=user).distinct()

# views.py
class EvenementMarcheChienUserListView(APIView):
    permission_classes = [AllowAny] 
    
    def get(self, request):
        # Get upcoming events (current date or future)
        today = date.today()
        evenements = EvenementMarcheChien.objects.filter(date__gte=today).order_by('date')
        serializer = EvenementMarcheChienSerializer(evenements, many=True)
        return Response(serializer.data)

class EvenementMarcheChienDetailsView(APIView):
    permission_classes = [AllowAny]  # Change from IsAuthenticated to AllowAny
    
    def get(self, request, pk):
        try:
            evenement = EvenementMarcheChien.objects.get(pk=pk)
            serializer = EvenementMarcheChienSerializer(evenement)
            
            # Only attempt to get user-specific information if user is authenticated
            demande_data = None
            if request.user.is_authenticated:
                user_demande = DemandeEvenementMarche.objects.filter(
                    utilisateur=request.user,
                    evenement=evenement
                ).first()
                
                if user_demande:
                    demande_serializer = DemandeEvenementMarcheSerializer(user_demande)
                    demande_data = demande_serializer.data
            
            return Response({
                'evenement': serializer.data,
                'user_demande': demande_data
            })
        except EvenementMarcheChien.DoesNotExist:
            return Response({'error': 'Événement non trouvé'}, status=404)

class DemandeEvenementMarcheCreateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        evenement_id = request.data.get('evenement')
        chiens_ids = request.data.get('chiens', [])
        
        # Validate number of dogs
        if not chiens_ids:
            return Response({'error': 'Veuillez sélectionner au moins un chien'}, status=400)
        
        if len(chiens_ids) > 3:
            return Response({'error': 'Vous ne pouvez pas sélectionner plus de 3 chiens'}, status=400)
        
        try:
            evenement = EvenementMarcheChien.objects.get(pk=evenement_id)
            
            # Check if dogs are part of the event
            for chien_id in chiens_ids:
                if not evenement.chiens.filter(id=chien_id).exists():
                    return Response({'error': f'Chien avec ID {chien_id} n\'est pas dans cet événement'}, status=400)
            
            # Check if user already has requests for any of these dogs
            existing_demandes = DemandeEvenementMarche.objects.filter(
                utilisateur=request.user,
                evenement=evenement,
                chiens__id__in=chiens_ids
            ).distinct()
            
            if existing_demandes.exists():
                conflicting_dogs = []
                for demande in existing_demandes:
                    for chien in demande.chiens.filter(id__in=chiens_ids):
                        conflicting_dogs.append(chien.nom)
                
                return Response({
                    'error': 'Vous avez déjà une demande pour ces chiens: ' + ', '.join(conflicting_dogs),
                    'conflicting_dogs': conflicting_dogs
                }, status=400)
            
            # Create new request
            demande = DemandeEvenementMarche.objects.create(
                utilisateur=request.user,
                evenement=evenement,
                statut='En attente'
            )
            
            for chien_id in chiens_ids:
                chien = Animal.objects.get(id=chien_id)
                demande.chiens.add(chien)
    
            serializer = DemandeEvenementMarcheSerializer(demande)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except EvenementMarcheChien.DoesNotExist:
            return Response({'error': 'Événement non trouvé'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)
class UserDemandesEvenementMarcheView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        demandes = DemandeEvenementMarche.objects.filter(utilisateur=request.user).order_by('-date_demande')
        serializer = DemandeEvenementMarcheSerializer(demandes, many=True)
        return Response(serializer.data)
# Add this to your views.py
class AnimalDetailedView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            animal = get_object_or_404(Animal, pk=pk)
            serializer = AnimalSerializer(animal)
            
            # Get dog participation in events
            events_participated = animal.evenements_marche.all()
            events_data = []
            if events_participated:
                for event in events_participated:
                    events_data.append({
                        'id': event.id,
                        'titre': event.titre,
                        'date': str(event.date),  # Convert date to string for JSON
                        'lieu': event.lieu
                    })
            
            # Get adoption/garde status
            adoption_status = None
            adoption_requests = animal.demandes_adoption.filter(utilisateur=request.user).first()
            if adoption_requests:
                adoption_status = adoption_requests.statut
                
            garde_status = None
            garde_requests = animal.demandes_garde.filter(utilisateur=request.user).first()
            if garde_requests:
                garde_status = garde_requests.statut
            
            # Calculate age in years and months
            today = date.today()
            dob = animal.date_naissance
            age_years = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            age_months = (today.month - dob.month) % 12
            if today.day < dob.day:
                age_months = (age_months - 1) % 12
                
            age_display = ""
            if age_years > 0:
                age_display += f"{age_years} an{'s' if age_years > 1 else ''}"
                if age_months > 0:
                    age_display += f" et {age_months} mois"
            else:
                age_display = f"{age_months} mois"
            
            return Response({
                'animal': serializer.data,
                'evenements': events_data,
                'adoption_status': adoption_status,
                'garde_status': garde_status,
                'age_display': age_display
            })
        except Animal.DoesNotExist:
            return Response({'error': 'Animal not found'}, status=404)
class AdoptedCountView(APIView):
    """
    Returns the total number of adopted animals, based on entries in the Adoption table.
    """
    def get(self, request, pk=None, format=None):
        # Count all Adoption records (or you could filter by pk if that makes sense)
        count = Adoption.objects.count()
        return Response(
            {'adopted_count': count},
            status=status.HTTP_200_OK
        )