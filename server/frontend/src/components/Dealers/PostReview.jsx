import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import './Dealers.css';
import '../assets/style.css';
import Header from '../Header/Header';

const PostReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dealer, setDealer] = useState(null);
  const [cars, setCars] = useState([]);
  const [review, setReview] = useState('');
  const [selectedCarIndex, setSelectedCarIndex] = useState('');
  const [year, setYear] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isLoggedIn = Boolean(sessionStorage.getItem('username'));

  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [dealerResponse, carsResponse] = await Promise.all([
          fetch(`/djangoapp/dealer/${id}`),
          fetch('/djangoapp/get_cars'),
        ]);
        const [dealerPayload, carsPayload] = await Promise.all([dealerResponse.json(), carsResponse.json()]);
        if (!dealerResponse.ok || dealerPayload.status !== 200 || !dealerPayload.dealer?.length) {
          throw new Error('Dealership not found.');
        }
        if (!carsResponse.ok || !Array.isArray(carsPayload.CarModels)) {
          throw new Error('Unable to load available car models.');
        }
        setDealer(dealerPayload.dealer[0]);
        setCars(carsPayload.CarModels);
      } catch (requestError) {
        setError(requestError.message || 'Unable to load the review form.');
      }
    };
    loadFormData();
  }, [id]);

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  const submitReview = async (event) => {
    event.preventDefault();
    const selectedCar = cars[Number(selectedCarIndex)];
    if (!selectedCar) {
      setError('Choose a car make and model.');
      return;
    }

    const firstName = sessionStorage.getItem('firstname');
    const lastName = sessionStorage.getItem('lastname');
    const name = firstName && lastName ? `${firstName} ${lastName}` : sessionStorage.getItem('username');
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/djangoapp/add_review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          dealership: Number(id),
          review,
          purchase: true,
          purchase_date: date,
          car_make: selectedCar.CarMake,
          car_model: selectedCar.CarModel,
          car_year: Number(year),
        }),
      });
      const payload = await response.json();
      if (!response.ok || payload.status !== 200) throw new Error(payload.message || payload.error || 'Unable to post your review.');
      navigate(`/dealer/${id}`);
    } catch (requestError) {
      setError(requestError.message || 'Unable to post your review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div><Header />
      <main className="review-form-page">
        <h1>Review {dealer?.full_name || 'dealership'}</h1>
        {error && <p className="dealer-message" role="alert">{error}</p>}
        <form className="review-form" onSubmit={submitReview}>
          <label htmlFor="review">Your review</label>
          <textarea id="review" value={review} onChange={(event) => setReview(event.target.value)} required rows="7" />
          <label htmlFor="purchase-date">Purchase date</label>
          <input id="purchase-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          <label htmlFor="car">Car make and model</label>
          <select id="car" value={selectedCarIndex} onChange={(event) => setSelectedCarIndex(event.target.value)} required>
            <option value="" disabled>Choose a car make and model</option>
            {cars.map((car, index) => <option key={`${car.CarMake}-${car.CarModel}`} value={index}>{car.CarMake} {car.CarModel}</option>)}
          </select>
          <label htmlFor="car-year">Car year</label>
          <input id="car-year" type="number" min="1900" max={new Date().getFullYear()} value={year} onChange={(event) => setYear(event.target.value)} required />
          <button className="postreview" type="submit" disabled={submitting}>{submitting ? 'Posting…' : 'Post review'}</button>
        </form>
      </main>
    </div>
  );
};

export default PostReview;
