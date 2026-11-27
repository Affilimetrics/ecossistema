import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import MarketingPage from "./marketing-page/MarketingPage.jsx";
import SignInSide from "./pages/auth/sign-in-side/SignInSide.jsx";
import SignUp from "./pages/auth/sign-up/SignUp.jsx";
import { DashboardShell, ExampleContent, DarkModeProvider, useDarkMode } from "./components/layout/dashboard-with-collapsible-sidebar";
import Products from "./pages/dashboard/products";
import HotProducts from "./pages/dashboard/hot-products";
import ColetaGeral from "./pages/dashboard/coleta-geral";
import Analytics from "./pages/dashboard/analytics";
import Remarketing from "./pages/dashboard/remarketing";
import Settings from "./pages/dashboard/settings";
import CentralDivulgacao from "./pages/dashboard/central-divulgacao";
import { Metrics } from "./pages/dashboard/metrics";
import "./styles.css";

function DashboardLayout() {
  const { isDark, setIsDark } = useDarkMode();
  return (
    <DashboardShell isDark={isDark} setIsDark={setIsDark}>
      <Outlet />
    </DashboardShell>
  );
}

function DashboardHome() {
  const { isDark, setIsDark } = useDarkMode();
  return <ExampleContent isDark={isDark} setIsDark={setIsDark} />;
}

function MetricsPageWrapper() {
  const { isDark, setIsDark } = useDarkMode();
  return <Metrics isDark={isDark} setIsDark={setIsDark} />;
}

function ProductsPageWrapper() {
  const { isDark, setIsDark } = useDarkMode();
  return <Products isDark={isDark} setIsDark={setIsDark} />;
}

function HotProductsPageWrapper() {
  const { isDark, setIsDark } = useDarkMode();
  return <HotProducts isDark={isDark} setIsDark={setIsDark} />;
}

function ColetaGeralPageWrapper() {
  const { isDark, setIsDark } = useDarkMode();
  return <ColetaGeral isDark={isDark} setIsDark={setIsDark} />;
}

function AnalyticsPageWrapper() {
  const { isDark, setIsDark } = useDarkMode();
  return <Analytics isDark={isDark} setIsDark={setIsDark} />;
}

function RemarketingPageWrapper() {
  const { isDark, setIsDark } = useDarkMode();
  return <Remarketing isDark={isDark} setIsDark={setIsDark} />;
}

function SettingsPageWrapper() {
  const { isDark, setIsDark } = useDarkMode();
  return <Settings isDark={isDark} setIsDark={setIsDark} />;
}

function CentralDivulgacaoPageWrapper() {
  const { isDark, setIsDark } = useDarkMode();
  return <CentralDivulgacao isDark={isDark} setIsDark={setIsDark} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DarkModeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MarketingPage />} />
          <Route path="/login" element={<SignInSide />} />
          <Route path="/cadastro" element={<SignUp />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboardv2" element={<DashboardHome />} />
            <Route path="/metrics" element={<MetricsPageWrapper />} />
            <Route path="/divulgacao" element={<CentralDivulgacaoPageWrapper />} />
            <Route path="/products" element={<ProductsPageWrapper />} />
            <Route path="/hot-products" element={<HotProductsPageWrapper />} />
            <Route path="/coleta-geral" element={<ColetaGeralPageWrapper />} />
            <Route path="/analytics" element={<AnalyticsPageWrapper />} />
            <Route path="/remarketing" element={<RemarketingPageWrapper />} />
            <Route path="/settings" element={<SettingsPageWrapper />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DarkModeProvider>
  </React.StrictMode>
);