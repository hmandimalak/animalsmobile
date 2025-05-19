from rest_framework import serializers

from .models import ArticlesCommande, Commande, Notification, Produit

### 📦 Serializer Produit ###
class ProduitSerializer(serializers.ModelSerializer):
     is_discount_active = serializers.SerializerMethodField()
     prix_promotion      = serializers.SerializerMethodField()
 
     class Meta:
         model  = Produit
         fields = [
             'id', 'nom', 'description', 'prix', 'prix_promotion',
             'stock', 'categorie', 'image', 'is_discount_active',
             'discount_percent', 'date_ajout'
         ]

     def get_is_discount_active(self, obj):
        return obj.is_discount_active  # Map backend field to frontend field

     def get_prix_promotion(self, obj):
        return obj.prix_promotion  # Expose computed property
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
class CommandeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commande
        fields = '__all__'

class ArticlesCommandeSerializer(serializers.ModelSerializer):
    nom = serializers.CharField(source='produit.nom')
    image = serializers.CharField(source='produit.image')
    prix = serializers.DecimalField(source='prix_unitaire', max_digits=10, decimal_places=2)
    class Meta:
        model = ArticlesCommande
        fields = ['id', 'nom', 'image', 'quantite', 'prix']


class CommandeDetailSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    class Meta:
        model = Commande
        fields = ['id', 'numero_commande', 'total_prix', 'statut', 'date_commande', 
                 'adresse_livraison', 'methode_paiement', 'items']

    def get_items(self, obj):
        articles = ArticlesCommande.objects.filter(commande=obj)
        return ArticlesCommandeSerializer(articles, many=True).data
