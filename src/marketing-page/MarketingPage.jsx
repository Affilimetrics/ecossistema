import React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from '../shared-theme/AppTheme';
import AppAppBar from './components/AppAppBar';
import Hero from './components/Hero';
import LogoCollection from './components/LogoCollection';
import Highlights from './components/Highlights';
import Pricing from './components/Pricing';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Footer from './components/Footer';

export default function MarketingPage(props) {
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <div className="bg-[#0B0F17] min-h-screen text-slate-100 font-sans antialiased">
        <AppAppBar />
        <main>
          <Hero />
          <LogoCollection />
          <Features />
          <Highlights />
          <Testimonials />
          <Pricing />
          <FAQ />
        </main>
        <Footer />
      </div>
    </AppTheme>
  );
}