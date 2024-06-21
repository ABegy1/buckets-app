import React from 'react';
import '../../../src/homepage.css';


const About = () => {
  return (
    <div>
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
          <div className="column green">
            <div>Green</div>
            <div>Stephen</div>
            <div>David</div>
            <div>Brandon</div>
          </div>
          <div className="column yellow">
            <div>Yellow</div>
            <div>Andrew</div>
            <div>McNay</div>
            <div>Jay</div>
          </div>
          <div className="column red">
            <div>Red</div>
            <div>Jarrod</div>
            <div>Brad</div>
            <div>Jason</div>
          </div>
          <div className="column black">
            <div>Black</div>
            <div>Ryan</div>
            <div>Kevin</div>
            <div>Malson</div>
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
