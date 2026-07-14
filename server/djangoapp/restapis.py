"""Utility functions for backend HTTP requests and review processing.

The helpers in this module provide a resilient bridge between the Django views
and the local dealership review backend, including a fallback to JSON files.
"""

import json
import os
from pathlib import Path
from urllib.parse import quote, urlencode

import requests
from dotenv import load_dotenv

load_dotenv()

backend_url = os.getenv('backend_url', default='http://localhost:3030')
sentiment_analyzer_url = os.getenv('sentiment_analyzer_url', default='http://localhost:5050/')

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / 'database' / 'data'


def _load_json(filename):
    """Load a JSON payload from the local data directory.

    Args:
        filename: Name of the JSON file to read.

    Returns:
        dict: Parsed JSON content or an empty dictionary when unavailable.
    """
    path = DATA_DIR / filename
    if not path.exists():
        return {}
    with path.open('r', encoding='utf-8') as handle:
        return json.load(handle)


def _write_json(filename, data):
    """Persist a JSON payload to the local data directory.

    Args:
        filename: Name of the JSON file to update.
        data: Dictionary payload to write to disk.
    """
    path = DATA_DIR / filename
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', encoding='utf-8') as handle:
        json.dump(data, handle, indent=2)


def get_request(endpoint, **kwargs):
    """Fetch data from the local review backend or fall back to JSON files.

    Args:
        endpoint: API endpoint path to request.
        **kwargs: Optional query string parameters.

    Returns:
        dict: Normalized payload containing dealer or review data.
    """
    request_url = backend_url.rstrip('/') + endpoint
    if kwargs:
        request_url = request_url + '?' + urlencode(kwargs)

    try:
        response = requests.get(request_url, timeout=5)
        response.raise_for_status()
        payload = response.json()
        if isinstance(payload, list):
            if endpoint.startswith('/fetchReviews'):
                return {'status': 200, 'reviews': payload}
            if endpoint.startswith('/fetchDealer/'):
                return {'status': 200, 'dealer': payload}
            return {'status': 200, 'dealers': payload}
        return payload
    except Exception:
        dealers = _load_json('dealerships.json').get('dealerships', [])
        if endpoint.startswith('/fetchDealers'):
            if endpoint == '/fetchDealers':
                return {'status': 200, 'dealers': dealers}
            state = endpoint.split('/fetchDealers/', 1)[1]
            filtered_dealers = [dealer for dealer in dealers if dealer.get('state', '').lower() == state.lower()]
            return {'status': 200, 'dealers': filtered_dealers}
        if endpoint.startswith('/fetchDealer/'):
            dealer_id = endpoint.split('/')[-1]
            dealer = [dealer for dealer in dealers if str(dealer.get('id')) == str(dealer_id)]
            return {'status': 200, 'dealer': dealer}
        if endpoint.startswith('/fetchReviews'):
            reviews = _load_json('reviews.json').get('reviews', [])
            if endpoint.startswith('/fetchReviews/dealer/'):
                dealer_id = endpoint.split('/')[-1]
                filtered_reviews = [review for review in reviews if str(review.get('dealership')) == str(dealer_id)]
                return {'status': 200, 'reviews': filtered_reviews}
            return {'status': 200, 'reviews': reviews}
        return {'status': 500, 'message': 'Unable to reach backend'}


def analyze_review_sentiments(text):
    """Infer a sentiment label for a review string.

    Args:
        text: Review text to analyze.

    Returns:
        str: Sentiment label such as positive, negative, or neutral.
    """
    request_url = sentiment_analyzer_url.rstrip('/') + '/analyze/' + quote(text, safe='')
    try:
        response = requests.get(request_url, timeout=5)
        response.raise_for_status()
        payload = response.json()
        if isinstance(payload, dict):
            return payload.get('sentiment', payload.get('result', 'neutral'))
        return payload
    except Exception:
        lowered = text.lower()
        if any(word in lowered for word in ['good', 'great', 'excellent', 'amazing', 'love', 'fantastic', 'awesome']):
            return 'positive'
        if any(word in lowered for word in ['bad', 'poor', 'terrible', 'awful', 'hate', 'angry', 'disappointed']):
            return 'negative'
        return 'neutral'


def post_review(data_dict):
    """Store a review locally when the backend is unavailable.

    Args:
        data_dict: Review payload to persist.

    Returns:
        dict: Response payload describing the stored review.
    """
    try:
        response = requests.post(backend_url.rstrip('/') + '/insert_review', json=data_dict, timeout=5)
        response.raise_for_status()
        return response.json()
    except Exception:
        reviews_data = _load_json('reviews.json')
        reviews = reviews_data.get('reviews', [])
        new_id = max((review.get('id', 0) for review in reviews), default=0) + 1
        review_payload = {'id': new_id, **data_dict}
        reviews.append(review_payload)
        reviews_data['reviews'] = reviews
        _write_json('reviews.json', reviews_data)
        return {'status': 200, 'message': 'Review stored locally', 'review': review_payload}
