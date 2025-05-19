from django.db import models
from django.utils.text import slugify
from accounts.serializers import User

class BlogContent(models.Model):
    SECTION_CHOICES = [
        ('garde', 'Garde Service'),
        ('evenement', 'Événements'),
        ('conseil', 'Conseils'),
        ('story', 'Adoption Stories'),
    ]
    section_type = models.CharField(max_length=20, choices=SECTION_CHOICES)
    title = models.CharField(max_length=200)
    content = models.JSONField()
    image = models.ImageField(upload_to='blog/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
   
    class Meta:
        ordering = ['order']
        verbose_name = 'Blog Section'
        verbose_name_plural = 'Blog Sections'

    def __str__(self):
        return f"{self.get_section_type_display()}: {self.title}"

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    excerpt = models.TextField(max_length=300, blank=True)
    featured_image = models.ImageField(upload_to='blog/posts/')
    published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Blog Post'
        verbose_name_plural = 'Blog Posts'
    
    def save(self, *args, **kwargs):
        # Generate slug from title if not provided
        if not self.slug:
            self.slug = slugify(self.title)
            
        # Auto-generate excerpt if not provided
        if not self.excerpt and self.content:
            # Take first 250 characters of content without HTML tags
            excerpt = self.content[:250]
            if len(self.content) > 250:
                excerpt += '...'
            self.excerpt = excerpt
            
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.title