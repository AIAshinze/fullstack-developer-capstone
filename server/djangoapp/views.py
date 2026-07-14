"""View handlers for authentication, dealership data, and review submission.

These views bridge the Django frontend with the local dealer and review backend
services used by the capstone project.
"""

import json
import logging
from urllib.parse import quote

from django.contrib.auth import authenticate, login, logout as django_logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import CarMake, CarModel
from .populate import initiate
from .restapis import analyze_review_sentiments, get_request, post_review

logger = logging.getLogger(__name__)


@csrf_exempt
def login_user(request):
    """Authenticate a user and create a session for a successful login.

    Args:
        request: Django request object containing login credentials.

    Returns:
        JsonResponse: JSON payload with the authentication status.
    """
    try:
        data = json.loads(request.body.decode("utf-8")) if request.body else {}
    except Exception:
        data = request.POST.dict()

    username = data.get("userName") or data.get("username")
    password = data.get("password")

    if not username or not password:
        return JsonResponse({"status": "error", "message": "Missing credentials"}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return JsonResponse({"userName": username, "status": "Authenticated"})

    return JsonResponse({"userName": username, "status": "Invalid credentials"}, status=401)


@csrf_exempt
def logout_user(request):
    """End the current session for an authenticated user.

    Args:
        request: Django request object for the logout action.

    Returns:
        JsonResponse: JSON payload that clears the current user name.
    """

    django_logout(request)
    return JsonResponse({"userName": ""})


@csrf_exempt
def registration(request):
    """Create a new user account and log the user in.

    Args:
        request: Django request object containing registration details.

    Returns:
        JsonResponse: JSON payload confirming registration or describing an error.
    """
    try:
        data = json.loads(request.body.decode("utf-8")) if request.body else {}
    except Exception:
        data = request.POST.dict()

    username = data.get("userName") or data.get("username")
    password = data.get("password")
    first_name = data.get("firstName", "")
    last_name = data.get("lastName", "")

    if not username or not password:
        return JsonResponse({"status": "error", "message": "Username and password are required"}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({"status": "error", "message": "User already exists"}, status=400)

    user = User.objects.create_user(username=username, password=password, first_name=first_name, last_name=last_name)
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return JsonResponse({"userName": username, "status": "Authenticated"})

    return JsonResponse({"status": "error", "message": "Registration failed"}, status=500)


def get_dealerships(request, state="All"):
    """Return dealership data for a requested state or all states.

    Args:
        request: Django request object for the dealership lookup.
        state: Optional state filter; defaults to all dealerships.

    Returns:
        JsonResponse: JSON payload containing the matching dealerships.
    """
    endpoint = "/fetchDealers"
    if state and str(state).lower() != "all":
        endpoint = f"/fetchDealers/{quote(str(state), safe='')}"

    response = get_request(endpoint)
    status_code = response.get("status", 502) if isinstance(response, dict) else 502
    if status_code != 200:
        return JsonResponse(response if isinstance(response, dict) else {"status": status_code}, status=status_code)
    dealers = response.get("dealers", []) if isinstance(response, dict) else []
    return JsonResponse({"status": 200, "dealers": dealers})


def get_dealer_reviews(request, dealer_id):
    """Return dealer reviews and calculate sentiment for each review.

    Args:
        request: Django request object for the reviews lookup.
        dealer_id: Identifier of the dealership whose reviews to fetch.

    Returns:
        JsonResponse: JSON payload containing review data and sentiment labels.
    """
    response = get_request(f"/fetchReviews/dealer/{dealer_id}")
    status_code = response.get("status", 502) if isinstance(response, dict) else 502
    if status_code != 200:
        return JsonResponse(response if isinstance(response, dict) else {"status": status_code}, status=status_code)
    reviews = response.get("reviews", []) if isinstance(response, dict) else []
    for review in reviews:
        review["sentiment"] = analyze_review_sentiments(review.get("review", ""))
    return JsonResponse({"status": 200, "reviews": reviews})


def get_dealer_details(request, dealer_id):
    """Return the public profile details for a single dealership.

    Args:
        request: Django request object for the dealership detail lookup.
        dealer_id: Identifier of the dealership to inspect.

    Returns:
        JsonResponse: JSON payload containing dealership details.
    """
    response = get_request(f"/fetchDealer/{dealer_id}")
    status_code = response.get("status", 502) if isinstance(response, dict) else 502
    if status_code != 200:
        return JsonResponse(response if isinstance(response, dict) else {"status": status_code}, status=status_code)
    dealer = response.get("dealer", []) if isinstance(response, dict) else []
    return JsonResponse({"status": 200, "dealer": dealer})


@csrf_exempt
def add_review(request):
    """Persist a buyer review and attach sentiment analysis metadata.

    Args:
        request: Django request object containing review content.

    Returns:
        JsonResponse: JSON payload from the review submission workflow.
    """
    if request.method != "POST":
        return JsonResponse({"status": 405, "message": "Method not allowed"}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"status": 403, "message": "Unauthorized"}, status=403)

    try:
        data = json.loads(request.body.decode("utf-8")) if request.body else {}
    except Exception:
        data = request.POST.dict()

    if not data:
        return JsonResponse({"status": 400, "message": "No review data supplied"}, status=400)

    data["sentiment"] = analyze_review_sentiments(data.get("review", ""))
    result = post_review(data)
    return JsonResponse(result)


def get_cars(request):
    """Return the available car makes and models for review submission.

    Args:
        request: Django request object for the vehicle inventory endpoint.

    Returns:
        JsonResponse: JSON payload containing car make/model pairs.
    """
    if not CarMake.objects.exists():
        initiate()

    car_models = CarModel.objects.select_related("car_make")
    cars = []
    for car_model in car_models:
        cars.append({"CarModel": car_model.name, "CarMake": car_model.car_make.name})
    return JsonResponse({"CarModels": cars})
