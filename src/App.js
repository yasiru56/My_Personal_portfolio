import "./App.css";
import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./Pages/Home/Navbar";
import Home from "./Pages/Home/Homescreen";
import IntroScreen from "./Pages/Intro/IntroScreen";
import WaveBackground from "./Pages/WaveBackground/WaveBackground";

function App() {
  const [showIntro, setShowIntro] = useState(true);
  // Mounted when the intro starts fading, so the hero entrance animations play on reveal
  const [showPortfolio, setShowPortfolio] = useState(false);

  return (
    <div className="App">
      <div className="background-effects">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>
        {showPortfolio && <WaveBackground />}
      </div>
      {showPortfolio && (
        <Router>
          <div>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="*" element={<div>404 Not Found</div>} />
            </Routes>
          </div>
        </Router>
      )}
      {showIntro && (
        <IntroScreen onReveal={() => setShowPortfolio(true)} onFinish={() => setShowIntro(false)} />
      )}
    </div>
  );
}

export default App;
