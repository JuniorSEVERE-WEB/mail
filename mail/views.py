import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse, HttpResponse
from django.shortcuts import HttpResponseRedirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

from .models import User, Email


def index(request):
    if request.user.is_authenticated:
        return render(request, "mail/inbox.html")
    else:
        return HttpResponseRedirect(reverse("login"))


@csrf_exempt
@login_required
def compose(request):
    """
    Accept POST JSON {recipients, subject, body}
    - Accept duplicate User rows by taking the first matching User for a given email.
    - Return 400 if any recipient email does not exist.
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON."}, status=400)

    recipients_field = data.get("recipients", "")
    recipients_emails = [e.strip() for e in recipients_field.split(",") if e.strip()]
    if not recipients_emails:
        return JsonResponse({"error": "At least one recipient required."}, status=400)

    recipients = []
    for addr in recipients_emails:
        users_qs = User.objects.filter(email=addr)
        if users_qs.count() == 0:
            return JsonResponse({"error": f"User with email {addr} does not exist."}, status=400)
        # If multiple users share same email, choose the first (workaround).
        # Admin should remove duplicates for data integrity.
        recipients.append(users_qs.first())

    subject = data.get("subject", "")
    body = data.get("body", "")

    # Create one Email object per involved user (owner/recipient copies)
    users_set = set()
    users_set.add(request.user)
    users_set.update(recipients)

    for user in users_set:
        email_obj = Email(
            user=user,
            sender=request.user,
            subject=subject,
            body=body,
            timestamp=timezone.now(),
            read=(user == request.user),
            archived=False
        )
        email_obj.save()
        for recipient in recipients:
            email_obj.recipients.add(recipient)
        email_obj.save()

    return JsonResponse({"message": "Email sent successfully."}, status=201)


@login_required
def mailbox(request, mailbox):
    """
    Return emails for the logged-in user for the given mailbox:
      - inbox: user is owner and is recipient and archived=False
      - sent: user is owner and sender=request.user
      - archive: any Email owned by user with archived=True
    """
    if mailbox == "inbox":
        emails = Email.objects.filter(user=request.user, recipients=request.user, archived=False)
    elif mailbox == "sent":
        emails = Email.objects.filter(user=request.user, sender=request.user)
    elif mailbox == "archive":
        emails = Email.objects.filter(user=request.user, archived=True)
    else:
        return JsonResponse({"error": "Invalid mailbox."}, status=400)

    emails = emails.order_by("-timestamp").all()
    return JsonResponse([email.serialize() for email in emails], safe=False)


@csrf_exempt
@login_required
def email(request, email_id):
    """
    GET: return email detail for the email owned by the logged-in user
    PUT: accept JSON {read?, archived?} to update flags
    """
    try:
        email = Email.objects.get(user=request.user, pk=email_id)
    except Email.DoesNotExist:
        return JsonResponse({"error": "Email not found."}, status=404)

    if request.method == "GET":
        return JsonResponse(email.serialize())

    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON."}, status=400)

        if data.get("read") is not None:
            email.read = data["read"]
        if data.get("archived") is not None:
            email.archived = data["archived"]
        email.save()
        return HttpResponse(status=204)

    else:
        return JsonResponse({"error": "GET or PUT request required."}, status=400)


def login_view(request):
    if request.method == "POST":
        email = request.POST["email"]
        password = request.POST["password"]
        user = authenticate(request, username=email, password=password)
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "mail/login.html", {"message": "Invalid email and/or password."})
    else:
        return render(request, "mail/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        email = request.POST["email"]
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "mail/register.html", {"message": "Passwords must match."})

        try:
            user = User.objects.create_user(email, email, password)
            user.save()
        except IntegrityError:
            return render(request, "mail/register.html", {"message": "Email address already taken."})
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "mail/register.html")