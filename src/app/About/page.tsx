import React from 'react';
import './bout.css';

const About = () => {
  return (
    <div className="about-page">
      <h1>About Page</h1>
      <p>This is the about page.</p>
      <div className="container">
        <div className="secondary-screen-options">
          <button>Standings</button>
          <button>Stats</button>
          <div className="arrow">→ View options for secondary screen</div>
        </div>
        <div className="rules">
          <button>Rules</button>
        </div>
        <div className="players">
          <div className="column">
            <div className="header">Green</div>
            <div className="box">Stephen</div>
            <div className="box">David</div>
            <div className="box">Brandon</div>
          </div>
          <div className="column">
            <div className="header">Yellow</div>
            <div className="box">Andrew</div>
            <div className="box">McNay</div>
            <div className="box">Jay</div>
          </div>
          <div className="column">
            <div className="header">Red</div>
            <div className="box">Jarrod</div>
            <div className="box">Brad</div>
            <div className="box">Jason</div>
          </div>
          <div className="column">
            <div className="header">Black</div>
            <div className="box">Ryan</div>
            <div className="box">Kevin</div>
            <div className="box">Malson</div>
          </div>
        </div>
        <div className="top-right">
          <div className="button-group">
            <button>Season</button>
            <button>View</button>
          </div>
        </div>
      </div>
    </div>
  );
};

About.displayName = 'About';

export default About;
