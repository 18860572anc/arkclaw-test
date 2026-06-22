import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConfigProvider } from '@arco-design/web-react';
import zhCN from '@arco-design/web-react/es/locale/zh-CN';
import type { MouseEvent } from 'react';
import { appRoutes } from './config/appRoutes';
import AppLayout from './layout/AppLayout';
import LoginPage from './pages/LoginPage';
import {
  OfficialContactPage,
  OfficialHomePage,
  OfficialNewYearActivityPage,
  OfficialPrivacyPolicyPage,
  OfficialServiceTermsPage,
} from './pages/marketing/OfficialSite';
import UnderConstructionPage from './pages/UnderConstructionPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import RegisterPage from './pages/public/RegisterPage';

const getArcoPopupContainer = (node: HTMLElement) =>
  node.closest('.arco-modal, .arco-drawer, .workspace, .topbar') ?? document.body;

const arcoCompositeControlSelector = '.arco-select, .arco-picker, .arco-cascader, .arco-tree-select';

const preventCompositeLabelActivation = (event: MouseEvent<HTMLDivElement>) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const label = target.closest('label');
  if (!label || !label.querySelector(arcoCompositeControlSelector)) return;
  event.preventDefault();
};

export default function App() {
  return (
    <ConfigProvider locale={zhCN} getPopupContainer={getArcoPopupContainer}>
      <div onClickCapture={preventCompositeLabelActivation}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<OfficialHomePage />} />
            <Route path="/2026/newyear" element={<OfficialNewYearActivityPage />} />
            <Route path="/contact" element={<OfficialContactPage />} />
            <Route path="/service-terms" element={<OfficialServiceTermsPage />} />
            <Route path="/privacy-policy" element={<OfficialPrivacyPolicyPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route element={<AppLayout />}>
              {appRoutes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
              <Route path="*" element={<UnderConstructionPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </div>
    </ConfigProvider>
  );
}
