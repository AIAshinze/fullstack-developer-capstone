import React, { useEffect, useState } from 'react';
import "./Dealers.css";
import "../assets/style.css";
import Header from '../Header/Header';
import review_icon from "../assets/reviewicon.png";

/**
 * Displays a searchable list of dealerships and allows authenticated users to
 * navigate to the review submission flow.
 *
 * @returns {JSX.Element} The dealer listing page UI.
 */
const Dealers = () => {
  const [dealersList, setDealersList] = useState([]);
  const [states, setStates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [originalDealers, setOriginalDealers] = useState([]);

  const dealer_url = "/djangoapp/get_dealers";

  /**
   * Fetch dealerships filtered by the selected state.
   *
   * @param {string} state - The state abbreviation or value "All".
   */
  const filterDealers = async (state) => {
    const endpoint = state && state.toLowerCase() !== 'all' ? `/djangoapp/get_dealers/${state}` : dealer_url;
    const res = await fetch(endpoint, { method: "GET" });
    const retobj = await res.json();
    if (retobj.status === 200) {
      const state_dealers = Array.from(retobj.dealers);
      setOriginalDealers(state_dealers);
      setDealersList(state_dealers);
    }
  };

  /**
   * Update the local search query and filter the current dealer list.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - The text input event.
   */
  const handleInputChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    if (!query) {
      setDealersList(originalDealers);
      return;
    }

    const filtered = originalDealers.filter((dealer) =>
      dealer.state.toLowerCase().includes(query.toLowerCase())
    );
    setDealersList(filtered);
  };

  const handleLostFocus = () => {
    if (!searchQuery) {
      setDealersList(originalDealers);
    }
  };

  const get_dealers = async () => {
    const res = await fetch(dealer_url, { method: "GET" });
    const retobj = await res.json();
    if (retobj.status === 200) {
      const all_dealers = Array.from(retobj.dealers);
      const uniqueStates = Array.from(new Set(all_dealers.map((dealer) => dealer.state)));
      setStates(uniqueStates);
      setOriginalDealers(all_dealers);
      setDealersList(all_dealers);
    }
  };

  useEffect(() => {
    get_dealers();
  }, []);

  const isLoggedIn = sessionStorage.getItem("username") != null;

  return (
    <div>
      <Header />
      <table className='table'>
        <thead>
          <tr>
            <th>ID</th>
            <th>Dealer Name</th>
            <th>City</th>
            <th>Address</th>
            <th>Zip</th>
            <th>
              <input
                type="text"
                placeholder="Search states..."
                onChange={handleInputChange}
                onBlur={handleLostFocus}
                value={searchQuery}
              />
            </th>
            {isLoggedIn ? <th>Review Dealer</th> : null}
          </tr>
        </thead>
        <tbody>
          {dealersList.map((dealer) => (
            <tr key={dealer.id}>
              <td>{dealer['id']}</td>
              <td><a href={'/dealer/' + dealer['id']}>{dealer['full_name']}</a></td>
              <td>{dealer['city']}</td>
              <td>{dealer['address']}</td>
              <td>{dealer['zip']}</td>
              <td>{dealer['state']}</td>
              {isLoggedIn ? (
                <td><a href={`/postreview/${dealer['id']}`}><img src={review_icon} className="review_icon" alt="Post Review" /></a></td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dealers
