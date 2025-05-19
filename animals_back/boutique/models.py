from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import pytz  # Ensure pytz is installed

class Produit(models.Model):
    CATEGORIES = [
        ('Nutrition', 'Nutrition'),
        ('Accessoires', 'Accessoires'),
        ('Hygiène', 'Hygiène'),
    ]
    serial_number = models.CharField(max_length=10, unique=True, blank=True)
    nom = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    prix = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    categorie = models.CharField(max_length=20, choices=CATEGORIES, default='Nutrition')
    image = models.ImageField(upload_to='products/')
    date_ajout = models.DateTimeField(auto_now_add=True)
    discount_percent = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0,
        verbose_name='Remise (%)',
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    discount_active = models.BooleanField(
        default=False,
        verbose_name='Promotion active'
    )
    discount_start_date = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name='Début de la promotion'
    )
    discount_end_date = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name='Fin de la promotion'
    )

    @property
    def prix_promotion(self):
        if self.is_discount_active:
            return self.prix * (1 - self.discount_percent / 100)
        return self.prix

    @property
    def is_discount_active(self):
        if not self.discount_active:
            return False

        now = timezone.now()
        return (
            self.discount_start_date
            and self.discount_end_date
            and self.discount_start_date <= now <= self.discount_end_date
        )

    def save(self, *args, **kwargs):
        if not self.serial_number:
            last_id = Produit.objects.aggregate(models.Max('id'))['id__max'] or 0
            self.serial_number = f"PROD-{str(last_id + 1).zfill(4)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.serial_number} - {self.nom}"

class Panier(models.Model):
    utilisateur = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Panier de {self.utilisateur.username}"

class ArticlesPanier(models.Model):
    panier = models.ForeignKey(Panier, on_delete=models.CASCADE)
    produit = models.ForeignKey(Produit, on_delete=models.CASCADE)
    quantite = models.PositiveIntegerField(default=1)
    date_ajout = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.quantite} x {self.produit.nom} dans le panier de {self.panier.utilisateur.username}"

class Commande(models.Model):
    numero_commande = models.CharField(max_length=10, unique=True, blank=True)
    utilisateur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    total_prix = models.DecimalField(max_digits=10, decimal_places=2)
    statut = models.CharField(
        max_length=50,
        choices=[
            ("En attente", "En attente"),
            ("Payée", "Payée"),
            ("Expédiée", "Expédiée"),
            ("Livrée", "Livrée"),
        ],
        default="En attente",
    )
    date_commande = models.DateTimeField(auto_now_add=True)
    adresse_livraison = models.TextField(blank=True, null=True)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    methode_paiement = models.CharField(max_length=50, default='livraison')

    def save(self, *args, **kwargs):
        if not self.numero_commande:
            last_id = Commande.objects.count() + 1
            self.numero_commande = f"CMD-{str(last_id).zfill(4)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.numero_commande} - {self.utilisateur.username}"

class ArticlesCommande(models.Model):
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE)
    produit = models.ForeignKey(Produit, on_delete=models.CASCADE)
    quantite = models.PositiveIntegerField(default=1)
    prix_unitaire = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        verbose_name='Prix unitaire (avec remise)')
    def __str__(self):
        return f"{self.quantite} x {self.produit.nom} dans {self.commande.numero_commande}"
class Notification(models.Model):
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='boutique_notifications'  # Changed from 'notifications'
    )
    message = models.TextField()
    date_creation = models.DateTimeField(auto_now_add=True)
    lu = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Notification for {self.utilisateur.nom}"