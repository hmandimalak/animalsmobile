from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.decorators import login_required
from .models import Notification, Produit, Panier, ArticlesPanier, Commande, ArticlesCommande
import json
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.views import APIView
from .serializers import CommandeDetailSerializer, NotificationSerializer, ProduitSerializer
from decimal import Decimal
from django.db import transaction

# Existing views
def get_produits(request):
    products = Produit.objects.all()
    
    # Apply category filter
    categorie = request.GET.get('categorie')
    animal = request.GET.get('animal')

    if categorie:
        products = products.filter(categorie=categorie)
    if animal:
        products = products.filter(animal=animal)
    # Apply search
    search = request.GET.get('search')
    if search:
        products = products.filter(nom__icontains=search)
    
    # Apply ordering
    ordering = request.GET.get('ordering')
    if ordering:
        products = products.order_by(ordering)
    
    # Return values as list
    serializer = ProduitSerializer(products, many=True, context={'request': request})
    return JsonResponse(serializer.data, safe=False)

def produit_detail(request, produit_id):
    product = Produit.objects.filter(id=produit_id).values('id', 'nom', 'description', 'prix', 'image', 'categorie').first()
    if product:
        return JsonResponse(product)
    else:
        return JsonResponse({'error': 'Product not found'}, status=404)

# New cart views


@api_view(['GET'])
@login_required
def get_panier(request):
    panier, created = Panier.objects.get_or_create(utilisateur=request.user)
    articles = ArticlesPanier.objects.filter(panier=panier).select_related('produit')
    
    cart_items = []
    for article in articles:
        produit = article.produit
        effective_price = produit.prix_promotion if produit.is_discount_active else produit.prix
        
        cart_items.append({
            'id': produit.id,
            'nom': produit.nom,
            'prix': float(effective_price),
            'image': produit.image.url if produit.image else None,
            'quantity': article.quantite
        })
    
    return Response(cart_items)

@api_view(['POST'])
@login_required
def ajouter_au_panier(request):
    data = json.loads(request.body)
    produit_id = data.get('produit_id')
    quantite = data.get('quantity', 1)
    produit = get_object_or_404(Produit, id=produit_id)
    panier, created = Panier.objects.get_or_create(utilisateur=request.user)
    article, created = ArticlesPanier.objects.get_or_create(
        panier=panier,
        produit=produit,
        defaults={'quantite': quantite}
    )
    if not created:
        article.quantite += quantite
        article.save()
    return Response({'status': 'success', 'message': 'Produit ajouté au panier'})



@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_quantite(request, produit_id):
    """
    Update the quantity of a product in the cart with enhanced error handling
    """
    try:
        # Parse request data
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return Response(
                {'error': 'Invalid JSON format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        quantity = data.get('quantity')
        
        # Validate quantity
        if quantity is None:
            return Response(
                {'error': 'Quantity parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not isinstance(quantity, (int, float)) or quantity < 0:
            return Response(
                {'error': 'Quantity must be a non-negative number'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create user's cart
        panier, created = Panier.objects.get_or_create(utilisateur=request.user)
        
        # Check if product exists
        try:
            produit = Produit.objects.get(id=produit_id)
        except Produit.DoesNotExist:
            return Response(
                {'error': 'Product not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Handle quantity update
        quantity = int(quantity)  # Ensure integer quantity
        
        if quantity > 0:
            article, created = ArticlesPanier.objects.get_or_create(
                panier=panier,
                produit_id=produit_id,
                defaults={'quantite': quantity}
            )
            
            if not created:
                article.quantite = quantity
                article.save()
            
            # Calculate effective price based on discount status
            effective_price = float(produit.prix_promotion if produit.is_discount_active else produit.prix)
            
            return Response({
                'success': True, 
                'message': 'Cart updated',
                'product': {
                    'id': produit.id,
                    'nom': produit.nom,
                    'prix': effective_price,  # Use effective price
                    'image': produit.image.url if produit.image else None,
                    'quantity': quantity
                }
            })
        else:
            # Remove item if quantity is 0
            ArticlesPanier.objects.filter(panier=panier, produit_id=produit_id).delete()
            return Response({
                'success': True, 
                'message': 'Product removed from cart'
            })
            
    except Exception as e:
        # Log the error (in production, use proper logging)
        print(f"Error in update_quantite: {str(e)}")
        
        return Response(
            {'error': 'Internal server error', 'detail': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def supprimer_du_panier(request, produit_id):
    """
    Remove a product from the cart
    """
    # Get user's cart
    try:
        panier = Panier.objects.get(utilisateur=request.user)
    except Panier.DoesNotExist:
        return Response({'error': 'Cart not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Delete the cart item
    try:
        article = ArticlesPanier.objects.get(panier=panier, produit_id=produit_id)
        article.delete()
        return Response({'success': True, 'message': 'Product removed from cart'})
    except ArticlesPanier.DoesNotExist:
        return Response({'error': 'Product not in cart'}, status=status.HTTP_404_NOT_FOUND)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def creer_commande(request):
    """
    Create a new order from the cart items and reduce product inventory
    """
    data = request.data
    adresse_livraison = data.get('adresse_livraison', '')
    telephone = data.get('telephone', '')
    methode_paiement = data.get('methode_paiement', 'livraison')
    
    try:
        panier = Panier.objects.get(utilisateur=request.user)
    except Panier.DoesNotExist:
        return Response({'error': 'Cart not found'}, status=status.HTTP_404_NOT_FOUND)
    
    articles = ArticlesPanier.objects.filter(panier=panier).select_related('produit')
    
    if not articles:
        return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)
    
    with transaction.atomic():
        # Validate inventory first
        for article in articles:
            if article.produit.stock < article.quantite:
                return Response({
                    'error': f'Not enough stock for {article.produit.nom}. Available: {article.produit.stock}'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Calculate total price with discounts
        total_prix = Decimal('0')
        for article in articles:
            produit = article.produit
            if produit.is_discount_active:
                prix = produit.prix_promotion  # Uses discounted price
            else:
                prix = produit.prix  # Regular price
            
            total_prix += prix * article.quantite

        # Create order
        commande = Commande.objects.create(
            utilisateur=request.user,
            total_prix=total_prix,
            statut="En attente",
            adresse_livraison=adresse_livraison,
            telephone=telephone,
            methode_paiement=methode_paiement
        )
        
        # Create order items with individual prices
        for article in articles:
            produit = article.produit
            if produit.is_discount_active:
                prix_unitaire = produit.prix_promotion
            else:
                prix_unitaire = produit.prix
            
            ArticlesCommande.objects.create(
                commande=commande,
                produit=produit,
                quantite=article.quantite,
                prix_unitaire=prix_unitaire  # Store exact price at order time
            )
            
            # Reduce inventory
            
            produit.save()

        # Clear cart
        articles.delete()
        
        return Response({
            'success': True,
            'message': 'Order created successfully',
            'numero_commande': commande.numero_commande
        })
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
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mes_commandes(request):
    commandes = Commande.objects.filter(utilisateur=request.user).order_by('-date_commande')
    serializer = CommandeDetailSerializer(commandes, many=True)
    return Response(serializer.data)