import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './Dealers.css';
import '../assets/style.css';
import positiveIcon from '../assets/positive.png';
import neutralIcon from '../assets/neutral.png';
import negativeIcon from '../assets/negative.png';
import reviewIcon from '../assets/reviewbutton.png';
import Header from '../Header/Header';

const sentimentIcon = (sentiment) => {
  if (sentiment === 'positive') return positiveIcon;
  if (sentiment === 'negative') return negativeIcon;
  return neutralIcon;
};

const Dealer = () => {
  const { id } = useParams();
  const [dealer, setDealer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isLoggedIn = Boolean(sessionStorage.getItem('username'));

  useEffect(() => {
    const loadDealer = async () => {
      try {
        const [dealerResponse, reviewsResponse] = await Promise.all([
          fetch(`/djangoapp/dealer/${id}`),
          fetch(`/djangoapp/reviews/dealer/${id}`),
        ]);
        const [dealerPayload, reviewsPayload] = await Promise.all([dealerResponse.json(), reviewsResponse.json()]);
        if (!dealerResponse.ok || dealerPayload.status !== 200 || !dealerPayload.dealer?.length) {
          throw new Error(dealerPayload.message || 'Dealership not found.');
        }
        if (!reviewsResponse.ok || reviewsPayload.status !== 200 || !Array.isArray(reviewsPayload.reviews)) {
          throw new Error(reviewsPayload.message || 'Unable to load reviews.');
        }
        setDealer(dealerPayload.dealer[0]);
        setReviews(reviewsPayload.reviews);
      } catch (requestError) {
        setError(requestError.message || 'Unable to load dealership details.');
      } finally {
        setLoading(false);
      }
    };
    loadDealer();
  }, [id]);

  return (
    <div>
      <Header />
      <main className="dealer-detail-page">
        {loading && <p className="dealer-message">Loading dealership details…</p>}
        {error && <p className="dealer-message" role="alert">{error}</p>}
        {dealer && <>
          <div className="dealer-heading">
            <div><h1>{dealer.full_name}</h1><p>{dealer.city}, {dealer.address}, ZIP {dealer.zip}, {dealer.state}</p></div>
            {isLoggedIn && <Link className="review-link" to={`/postreview/${id}`}><img src={reviewIcon} alt="Post a review" />Post a review</Link>}
          </div>
          <section aria-labelledby="reviews-heading">
            <h2 id="reviews-heading">Customer reviews</h2>
            {!reviews.length ? <p>No reviews yet.</p> : <div className="reviews_panel">
              {reviews.map((review) => <article className="review_panel" key={review.id || review._id}>
                <img src={sentimentIcon(review.sentiment)} className="emotion_icon" alt={`${review.sentiment || 'neutral'} sentiment`} />
                <p className="review">{review.review}</p>
                <p className="reviewer">{review.name} · {review.car_make} {review.car_model} ({review.car_year})</p>
              </article>)}
            </div>}
          </section>
        </>}
      </main>
    </div>
  );
};

export default Dealer;
