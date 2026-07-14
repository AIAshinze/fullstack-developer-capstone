import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Dealers.css';
import '../assets/style.css';
import Header from '../Header/Header';
import reviewIcon from '../assets/reviewicon.png';

const DEALERS_URL = '/djangoapp/get_dealers';

const Dealers = () => {
  const [dealers, setDealers] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isLoggedIn = Boolean(sessionStorage.getItem('username'));

  const loadDealers = async (state = 'All') => {
    setLoading(true);
    setError('');
    const endpoint = state === 'All' ? DEALERS_URL : `${DEALERS_URL}/${encodeURIComponent(state)}`;

    try {
      const response = await fetch(endpoint);
      const payload = await response.json();
      if (!response.ok || payload.status !== 200 || !Array.isArray(payload.dealers)) {
        throw new Error(payload.message || 'Unable to load dealerships.');
      }

      setDealers(payload.dealers);
      if (state === 'All') {
        setStates([...new Set(payload.dealers.map((dealer) => dealer.state))].sort());
      }
    } catch (requestError) {
      setDealers([]);
      setError(requestError.message || 'Unable to load dealerships.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDealers();
  }, []);

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    loadDealers(selectedState);
  };

  return (
    <div>
      <Header />
      <main className="dealers-page">
        <h1>Dealerships</h1>
        <form className="dealer-filter" onSubmit={handleFilterSubmit}>
          <label htmlFor="state-filter">State</label>
          <select id="state-filter" value={selectedState} onChange={(event) => setSelectedState(event.target.value)}>
            <option value="All">Show all</option>
            {states.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
          <button type="submit">Filter dealerships</button>
        </form>

        {error && <p className="dealer-message" role="alert">{error}</p>}
        {loading ? <p className="dealer-message">Loading dealerships…</p> : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th><th>Dealer Name</th><th>City</th><th>Address</th><th>Zip</th><th>State</th>
                  {isLoggedIn && <th>Review Dealer</th>}
                </tr>
              </thead>
              <tbody>
                {dealers.map((dealer) => (
                  <tr key={dealer.id}>
                    <td>{dealer.id}</td>
                    <td><Link to={`/dealer/${dealer.id}`}>{dealer.full_name}</Link></td>
                    <td>{dealer.city}</td><td>{dealer.address}</td><td>{dealer.zip}</td><td>{dealer.state}</td>
                    {isLoggedIn && <td><Link to={`/postreview/${dealer.id}`}><img src={reviewIcon} className="review_icon" alt={`Review ${dealer.full_name}`} /></Link></td>}
                  </tr>
                ))}
              </tbody>
            </table>
            {!dealers.length && <p className="dealer-message">No dealerships match this state.</p>}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dealers;
