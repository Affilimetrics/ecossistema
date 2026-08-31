import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './dashboard/Dashboard';
import SignInSide from './sign-in-side/SignInSide';
import SignUp from './sign-up/SignUp';
import MarketingPage from './marketing-page/MarketingPage';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignInSide />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/marketing" element={<MarketingPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);