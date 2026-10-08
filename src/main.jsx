import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles.css';
import Dashboard from './dashboard/Dashboard';
import SignInSide from './sign-in-side/SignInSide';
import SignUp from './sign-up/SignUp';
import MarketingPage from './marketing-page/MarketingPage';
import { Example as DashboardV2 } from './dashboardv2/dashboard-with-collapsible-sidebar';
import HotProductsPage from './dashboardv2/hot-products';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignInSide />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboardv2" element={<DashboardV2 />} />
        <Route path="/produtos-quentes" element={<HotProductsPage />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/marketing" element={<MarketingPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);