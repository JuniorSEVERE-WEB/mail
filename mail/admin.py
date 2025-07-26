from django.contrib import admin

# Register your models here.

from .models import User, Email

# Enregistre le modèle User
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)

# Enregistre le modèle Email
@admin.register(Email)
class EmailAdmin(admin.ModelAdmin):
    list_display = ('subject', 'sender', 'get_recipients', 'timestamp', 'read', 'archived')
    list_filter = ('read', 'archived', 'timestamp')
    search_fields = ('subject', 'sender__email', 'body')
    ordering = ('-timestamp',)
    readonly_fields = ('timestamp',)
    
    def get_recipients(self, obj):
        return ", ".join([user.email for user in obj.recipients.all()])
    get_recipients.short_description = 'Recipients'