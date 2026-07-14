import React, { useState } from 'react';
import Header from '../Header/Header';
import './Register.css';

/**
 * Renders the account registration form and submits the new user details.
 *
 * @returns {JSX.Element} The registration form UI.
 */
const Register = () => {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const register = async (e) => {
    e.preventDefault();

    const res = await fetch('/djangoapp/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName,
        password,
        firstName,
        lastName,
      }),
    });

    const json = await res.json();
    if (json.status === 'Authenticated') {
      sessionStorage.setItem('username', json.userName);
      window.location.href = '/';
    } else {
      alert(json.message || 'Registration failed');
    }
  };

  return (
    <div>
      <Header />
      <div className="register_panel">
        <form onSubmit={register}>
          <h3>Create an account</h3>
          <div className="input_field">
            <span>Username</span>
            <input type="text" onChange={(e) => setUserName(e.target.value)} />
          </div>
          <div className="input_field">
            <span>First Name</span>
            <input type="text" onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="input_field">
            <span>Last Name</span>
            <input type="text" onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="input_field">
            <span>Password</span>
            <input type="password" onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="action_button" type="submit">Register</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
