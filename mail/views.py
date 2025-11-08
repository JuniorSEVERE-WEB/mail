import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import HttpResponse, HttpResponseRedirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .models import User, Email


def index(request):
    # Authenticated users view their inbox
    if request.user.is_authenticated:
        return render(request, "mail/inbox.html")
    else:
        return HttpResponseRedirect(reverse("login"))


@csrf_exempt
@login_required
def compose(request):
    # Composing a new email must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    # Parse request data
    data = json.loads(request.body)
    recipients_field = data.get("recipients", "")
    emails = [email.strip() for email in recipients_field.split(",") if email.strip()]
    if not emails:
        return JsonResponse({"error": "At least one recipient required."}, status=400)

    # Convert email addresses to User instances, validating duplicates/missing
    recipients = []
    for addr in emails:
        users_qs = User.objects.filter(email=addr)
        if users_qs.count() == 0:
            return JsonResponse({"error": f"User with email {addr} does not exist."}, status=400)
        if users_qs.count() > 1:
            return JsonResponse({"error": f"Multiple users with email {addr}. Ask admin to remove duplicates."}, status=400)
        recipients.append(users_qs.first())

    # Get contents of email
    subject = data.get("subject", "")
    body = data.get("body", "")

    # Create one Email object per involved user (sender + each recipient as owner copy)
    users_set = set()
    users_set.add(request.user)
    users_set.update(recipients)
    for user in users_set:
        email_obj = Email(
            user=user,
            sender=request.user,
            subject=subject,
            body=body,
            read=(user == request.user)
        )
        email_obj.save()
        for recipient in recipients:
            email_obj.recipients.add(recipient)
        email_obj.save()

    return JsonResponse({"message": "Email sent successfully."}, status=201)


@login_required
def mailbox(request, mailbox):
    # Filter emails returned based on mailbox
    if mailbox == "inbox":
        emails = Email.objects.filter(user=request.user, recipients=request.user, archived=False)
    elif mailbox == "sent":
        emails = Email.objects.filter(user=request.user, sender=request.user)
    elif mailbox == "archive":
        emails = Email.objects.filter(user=request.user, recipients=request.user, archived=True)
    else:
        return JsonResponse({"error": "Invalid mailbox."}, status=400)

    # Return emails in reverse chronological order
    emails = emails.order_by("-timestamp").all()
    return JsonResponse([email.serialize() for email in emails], safe=False)


@csrf_exempt
@login_required
def email(request, email_id):
    # Query for requested email
    try:
        email = Email.objects.get(user=request.user, pk=email_id)
    except Email.DoesNotExist:
        return JsonResponse({"error": "Email not found."}, status=404)

    # Return email contents
    if request.method == "GET":
        return JsonResponse(email.serialize())

    # Update whether email is read or should be archived
    elif request.method == "PUT":
        data = json.loads(request.body)
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
        except IntegrityError as e:
            return render(request, "mail/register.html", {"message": "Email address already taken."})
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "mail/register.html")