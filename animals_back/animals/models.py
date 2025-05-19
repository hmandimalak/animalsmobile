# animals/models.py
from django.db import models
from datetime import date
from django.conf import settings
from django.core.exceptions import ValidationError

class Animal(models.Model):
    SEXE_CHOICES = [
        ('M', 'Male'),
        ('F', 'Femelle'),
    ]
    
    TYPE_GARDE_CHOICES = [
        ('Temporaire', 'Temporaire'),
        ('Définitive', 'Définitive'),
    ]

    nom = models.CharField(max_length=100)
    espece = models.CharField(max_length=50)  # Ex : Chien, Chat
    race = models.CharField(max_length=100, blank=True, null=True)
    date_naissance = models.DateField()  # Stocke la date de naissance
    sexe = models.CharField(max_length=1, choices=SEXE_CHOICES)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='animaux/', blank=True, null=True)

    # Disponibilité
    disponible_pour_adoption = models.BooleanField(default=False)
    disponible_pour_garde = models.BooleanField(default=False)
    
    # Type de garde (si applicable)
    type_garde = models.CharField(max_length=20, choices=TYPE_GARDE_CHOICES, default='Temporaire') 

    # Dates de garde temporaire
    date_reservation = models.DateField(blank=True, null=True)
    date_fin = models.DateField(blank=True, null=True)

    # Dates et suivi
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nom} ({self.espece})"

    def age(self):
        """ Calcule l'âge de l'animal à partir de la date de naissance. """
        today = date.today()
        return today.year - self.date_naissance.year - ((today.month, today.day) < (self.date_naissance.month, self.date_naissance.day))
        

    def en_garde_actuellement(self):
        """ Vérifie si l'animal est actuellement en garde temporaire """
        today = date.today()
        if self.type_garde == "Temporaire" and self.date_reservation and self.date_fin:
            return self.date_reservation <= today <= self.date_fin
        return False


class DemandeGarde(models.Model):
    STATUS_CHOICES = [
        ('En attente', 'En attente'),
        ('Acceptee', 'Acceptee'),
        ('Refusee', 'Refusee'),
    ]
    TYPE_GARDE_CHOICES = [
        ('Temporaire', 'Temporaire'),
        ('Définitive', 'Définitive'),
    ]

    animal = models.ForeignKey('Animal', on_delete=models.CASCADE, related_name='demandes_garde')
    utilisateur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='demandes_garde')
    date_demande = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='En attente')
    message = models.TextField(blank=True, null=True)
    type_garde = models.CharField(max_length=20, choices=TYPE_GARDE_CHOICES, default='Temporaire') 
    image = models.ImageField(upload_to='animaux/', blank=True, null=True)
    date_reservation = models.DateField(blank=False, null=False)  # Change to NOT NULL
    date_fin = models.DateField(blank=False, null=False)  # Change to NOT NULL



    def __str__(self):
        return f"Demande de garde pour {self.animal.nom} par {self.utilisateur.nom} ({self.statut})"

class Adoption(models.Model):
    animal = models.ForeignKey('Animal', on_delete=models.CASCADE, related_name='adoptions')
    utilisateur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='adoptions')
    date_adoption = models.DateTimeField(auto_now_add=True)
    message = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Adoption de {self.animal.nom} par {self.utilisateur.nom} le {self.date_adoption.strftime('%d/%m/%Y')}"
class DemandeAdoption(models.Model):
    STATUS_CHOICES = [
        ('En attente', 'En attente'),
        ('Acceptee', 'Acceptee'),
        ('Refusee', 'Refusee'),
    ]

    animal = models.ForeignKey('Animal', on_delete=models.CASCADE, related_name='demandes_adoption')
    utilisateur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='demandes_adoption')
    date_demande = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='En attente')
    message = models.TextField(blank=True, null=True)

    def clean(self):
        """ Ensure that the animal is available for adoption before saving the request. """
        if not self.animal.disponible_pour_adoption:
            raise ValidationError(f"L'animal {self.animal.nom} n'est pas disponible pour adoption.")

    def save(self, *args, **kwargs):
        self.clean()  # Call validation before saving
        super().save(*args, **kwargs)


    def __str__(self):
        return f"Demande d'adoption pour {self.animal.nom} par {self.utilisateur.nom} ({self.statut})"
class Garderie(models.Model):
    """Model to track active animal fosterings"""
    animal = models.OneToOneField('Animal', on_delete=models.CASCADE, related_name='garderie')
    utilisateur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='garderie')
    date_debut = models.DateField(auto_now_add=True)
    date_fin = models.DateField()
    image = models.ImageField(upload_to='animaux/', blank=True, null=True)
    type_garde = models.CharField(
        max_length=20, 
        choices=Animal.TYPE_GARDE_CHOICES,
        default='Temporaire'
    )
    
    
    def __str__(self):
        return f"Garderie de {self.animal.nom} par {self.utilisateur.nom} jusqu'au {self.date_fin}"
    
    class Meta:
        verbose_name = "Garderie"
        verbose_name_plural = "Garderies"
class HistoriqueDemandeGarde(models.Model):
    TYPE_GARDE_CHOICES = [
        ('Temporaire', 'Temporaire'),
        ('Définitive', 'Définitive'),
        ("Aucun", "Aucun"),
    ]
    # Change CASCADE to SET_NULL
    demande = models.ForeignKey(
        'DemandeGarde', 
        on_delete=models.SET_NULL,
        related_name='historique',
        null=True,
        blank=True
    )
    
    utilisateur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    statut_precedent = models.CharField(max_length=50)
    statut_nouveau = models.CharField(max_length=50)
    date_changement = models.DateTimeField(auto_now_add=True)
    type_garde = models.CharField(max_length=20, choices=TYPE_GARDE_CHOICES, default='Aucun') 
    animal = models.ForeignKey(
        'Animal', 
        on_delete=models.SET_NULL,
        related_name='historiquegarderie',
        null=True,
        blank=True
    )

    def __str__(self):
        animal_name = self.animal.nom if self.animal else "Unknown"
        return f"Historique Garde - {animal_name} - {self.statut_nouveau} ({self.date_changement})"
class HistoriqueDemandeAdoption(models.Model):
    demande = models.ForeignKey('DemandeAdoption', on_delete=models.SET_NULL, null=True, blank=True, related_name='historique')
    utilisateur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    statut_precedent = models.CharField(max_length=20)
    statut_nouveau = models.CharField(max_length=20)
    date_changement = models.DateTimeField(auto_now_add=True)
    animal = models.ForeignKey(
        'Animal', 
        on_delete=models.SET_NULL,
        related_name='historiqueadoption',
        null=True,
        blank=True
    )


    def __str__(self):
        animal_name = self.animal.nom if self.animal else "Unknown"
        return f"Historique Garde - {animal_name} - {self.statut_nouveau} ({self.date_changement})"
    
class Notification(models.Model):
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='animal_notifications'  # Changed from 'notifications'
    )
    message = models.TextField()
    date_creation = models.DateTimeField(auto_now_add=True)
    lu = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Notification for {self.utilisateur.nom}"
class DemandeEvenementMarche(models.Model):
    utilisateur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    evenement = models.ForeignKey('EvenementMarcheChien', on_delete=models.CASCADE, related_name='demandes')
    chiens = models.ManyToManyField('Animal', related_name='demandes_marche')
    date_demande = models.DateTimeField(auto_now_add=True)
    STATUS_CHOICES = [
        ('En attente', 'En attente'),
        ('Acceptee', 'Acceptee'),
        ('Refusee', 'Refusee'),
    ]
    statut = models.CharField(max_length=10, choices=STATUS_CHOICES, default='En attente')
    
    def __str__(self):
        return f"Demande de {self.utilisateur.username} pour {self.evenement.titre}"
    
    class Meta:
        verbose_name = "Demande d'événement de marche"
        verbose_name_plural = "Demandes d'événements de marche"
class EvenementMarcheChien(models.Model):
    titre = models.CharField(max_length=200)
    date = models.DateField()
    heure = models.TimeField()
    lieu = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    chiens = models.ManyToManyField('Animal', related_name='evenements_marche')
    date_creation = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.titre} - {self.date}"
    
    class Meta:
        verbose_name = "Événement de marche"
        verbose_name_plural = "Événements de marche"