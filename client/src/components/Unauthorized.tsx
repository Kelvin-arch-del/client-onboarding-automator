import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized: React.FC = () => {
  return (
    <div className="unauthorized-page">
      <div className="content">
        <h1>403 - Unauthorized</h1>
        <p>You don't have permission to access this resource.</p>
        <p>Contact your administrator if you believe this is an error.</p>
        <Link to="/" className="home-link">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
