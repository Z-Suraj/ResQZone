import React, { useState, useEffect } from 'react';
import { UserRole, Habitation, SafeZone } from './types';
import { LoginView } from './components/auth/LoginView';
import { RoleSelectionView } from './components/auth/RoleSelectionView';
import { CitizenNavbar } from './components/layout/CitizenNavbar';
import { CitizenSidebar } from './components/layout/CitizenSidebar';
import { AuthorityNavbar } from './components/layout/AuthorityNavbar';
import { AuthoritySidebar } from './components/layout/AuthoritySidebar';

// Citizen Views
import { CitizenDashboard } from './components/citizen/CitizenDashboard';
import { CitizenMapView } from './components/citizen/CitizenMapView';
import { CitizenMyAreaView } from './components/citizen/CitizenMyAreaView';
import { CitizenSafeZonesView } from './components/citizen/CitizenSafeZonesView';
import { ReportDisasterView } from './components/citizen/ReportDisasterView';
import { CitizenMyReportsView } from './components/citizen/CitizenMyReportsView';
import { CitizenRescueRequestView } from './components/citizen/CitizenRescueRequestView';
import { CitizenAlertsView } from './components/citizen/CitizenAlertsView';
import { CitizenEmergencyHelpView } from './components/citizen/CitizenEmergencyHelpView';
import { CitizenSettingsView } from './components/citizen/CitizenSettingsView';
import { CitizenAiAssistantModal } from './components/citizen/CitizenAiAssistantModal';

// Authority Views
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { HazardMapView } from './components/map/HazardMapView';
import { HabitationsView } from './components/habitations/HabitationsView';
import { CarryingCapacityView } from './components/capacity/CarryingCapacityView';
import { RelocationEngineView } from './components/relocation/RelocationEngineView';
import { AlertsView } from './components/alerts/AlertsView';
import { IncidentsView } from './components/incidents/IncidentsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { CopilotView } from './components/copilot/CopilotView';
import { SimulationSandboxView } from './components/simulation/SimulationSandboxView';
import { SettingsView } from './components/settings/SettingsView';

import { authService, AuthUser } from './services/authService';
import { ResQZoneLogo } from './components/common/ResQZoneLogo';
import { LoadingScreen } from './components/common/LoadingScreen';
import { RealtimeToastNotifier } from './components/common/RealtimeToastNotifier';
import { emergencyStore } from './services/emergencyStore';

type AppScreen = 'LOGIN' | 'ROLE_SELECT' | 'MAIN' | 'LOADING';

export default function App() {
  // Session initialization
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  
  // App screen navigation
  const [screen, setScreen] = useState<AppScreen>(() => {
    const session = authService.getCurrentSession();
    return session ? 'MAIN' : 'LOGIN';
  });

  const [userRole, setUserRole] = useState<UserRole>(() => {
    const session = authService.getCurrentSession();
    return session?.user.role || 'AUTHORITY';
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    const session = authService.getCurrentSession();
    return session?.user.role === 'CITIZEN' ? 'citizen-home' : 'dashboard';
  });

  // Persistent Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('resqzone_theme');
    return saved !== null ? saved === 'true' : true;
  });

  // Subscribe to auth state updates
  useEffect(() => {
    return authService.onAuthStateChange((session) => {
      if (session) {
        setCurrentUser(session.user);
        setUserRole(session.user.role);
      } else {
        setCurrentUser(null);
      }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('resqzone_theme', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [selectedHabitationForRelocation, setSelectedHabitationForRelocation] = useState<Habitation | null>(null);
  const [selectedSafeZoneForRelocation, setSelectedSafeZoneForRelocation] = useState<SafeZone | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>(() => {
    const loc = emergencyStore.getCurrentLocation();
    return loc ? `${loc.name}, ${loc.state || loc.district || ''}` : 'National Overview';
  });
  const [isCitizenAiOpen, setIsCitizenAiOpen] = useState<boolean>(false);

  // Keep selected region in sync with emergencyStore location
  useEffect(() => {
    return emergencyStore.subscribe(() => {
      const loc = emergencyStore.getCurrentLocation();
      if (loc) {
        setSelectedRegion(`${loc.name}, ${loc.state || loc.district || ''}`);
      } else {
        setSelectedRegion('National Overview');
      }
    });
  }, []);

  // Robust Tab Navigation Handler
  const handleNavigateTab = (tab: string) => {
    if (tab === 'citizen-view' || tab === 'citizen') {
      handleRoleChange('CITIZEN');
      return;
    }
    if (tab === 'authority-view') {
      handleRoleChange('AUTHORITY');
      return;
    }
    if (tab === 'overview') {
      setActiveTab('dashboard');
      return;
    }
    setActiveTab(tab);
  };

  // Authentication Callbacks
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setUserRole(user.role);
    if (user.role === 'CITIZEN') {
      setActiveTab('citizen-home');
      setScreen('MAIN');
    } else if (user.role === 'AUTHORITY') {
      setActiveTab('dashboard');
      setScreen('MAIN');
    } else {
      setScreen('ROLE_SELECT');
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setUserRole(role);
    if (currentUser) {
      const updated = await authService.setUserRole(role);
      if (updated) setCurrentUser(updated);
    }
    setActiveTab(role === 'CITIZEN' ? 'citizen-home' : 'dashboard');
    setScreen('MAIN');
  };

  const handleSelectRole = async (role: UserRole) => {
    setUserRole(role);
    if (currentUser) {
      const updated = await authService.setUserRole(role);
      if (updated) setCurrentUser(updated);
    }
    setActiveTab(role === 'CITIZEN' ? 'citizen-home' : 'dashboard');
    setScreen('MAIN');
  };

  const handleRoleChange = async (newRole: UserRole) => {
    setUserRole(newRole);
    if (currentUser) {
      const updated = await authService.setUserRole(newRole);
      if (updated) setCurrentUser(updated);
    }
    setActiveTab(newRole === 'CITIZEN' ? 'citizen-home' : 'dashboard');
  };

  const handleLogout = () => {
    authService.signOut();
    setCurrentUser(null);
    setScreen('LOGIN');
  };

  const handleReturnToLanding = () => {
    setScreen('LOGIN');
  };

  // Screen 1: Cinematic Production-Quality Login & Landing
  if (screen === 'LOGIN') {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onQuickDemo={handleQuickDemo}
        onReturnHome={handleReturnToLanding}
      />
    );
  }

  // Screen 2: Interactive Role Selection (Citizen vs Authority)
  if (screen === 'ROLE_SELECT') {
    return (
      <RoleSelectionView 
        onSelectRole={handleSelectRole} 
        onBackToLogin={handleReturnToLanding}
        userName={currentUser?.name}
      />
    );
  }

  // Screen 2.5: Loading Screen with ResQZone Official Branding
  if (screen === 'LOADING') {
    return (
      <LoadingScreen 
        darkMode={darkMode}
        statusText="SYNCHRONIZING DISASTER INTELLIGENCE TELEMETRY"
        subtext="Loading geospatial hazard models & carrying capacity metrics..."
      />
    );
  }

  // Screen 3: Main Application Shell (Strictly Split Citizen vs Authority)
  const isCitizen = userRole === 'CITIZEN';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      darkMode ? 'bg-[#090e17] text-slate-100' : 'bg-[#F4F6F8] text-slate-900'
    }`}>
      {/* 1. ROLE-SPECIFIC APP NAVBAR */}
      {isCitizen ? (
        <CitizenNavbar
          currentTab={activeTab}
          onNavigateTab={handleNavigateTab}
          onRoleChange={handleRoleChange}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onOpenAiAssistant={() => setIsCitizenAiOpen(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
          onReturnToLanding={handleReturnToLanding}
        />
      ) : (
        <AuthorityNavbar
          onRoleChange={handleRoleChange}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onOpenSettings={() => setActiveTab('settings')}
          onOpenWhatIf={() => setActiveTab('whatif')}
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
          onNavigateTab={handleNavigateTab}
          currentUser={currentUser}
          onLogout={handleLogout}
          onReturnToLanding={handleReturnToLanding}
        />
      )}

      {/* 2. ROLE-SPECIFIC WORKSPACE (SIDEBAR + MAIN VIEW) */}
      <div className="flex-1 flex overflow-hidden">
        {isCitizen ? (
          <CitizenSidebar
            currentTab={activeTab}
            onSelectTab={handleNavigateTab}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            darkMode={darkMode}
            onOpenAiAssistant={() => setIsCitizenAiOpen(true)}
          />
        ) : (
          <AuthoritySidebar
            currentTab={activeTab}
            onSelectTab={handleNavigateTab}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            darkMode={darkMode}
            onSwitchToCitizen={() => {
              setUserRole('CITIZEN');
              setActiveTab('citizen-home');
            }}
          />
        )}

        {/* Scrollable Content Body */}
        <main className="flex-1 overflow-y-auto min-h-0 bg-transparent">
          {/* ================= CITIZEN VIEWS ================= */}
          {isCitizen && (
            <>
              {(activeTab === 'citizen-home' || activeTab === 'citizen') && (
                <CitizenDashboard
                  onNavigateTab={handleNavigateTab}
                  darkMode={darkMode}
                />
              )}

              {activeTab === 'citizen-map' && (
                <CitizenMapView
                  darkMode={darkMode}
                  onNavigateTab={handleNavigateTab}
                />
              )}

              {activeTab === 'citizen-my-area' && (
                <CitizenMyAreaView
                  darkMode={darkMode}
                  onNavigateTab={handleNavigateTab}
                />
              )}

              {activeTab === 'safe-zones' && (
                <CitizenSafeZonesView
                  darkMode={darkMode}
                  onNavigateTab={handleNavigateTab}
                />
              )}

              {activeTab === 'report' && (
                <ReportDisasterView
                  onBack={() => setActiveTab('citizen-home')}
                  onViewMyReports={() => setActiveTab('my-reports')}
                  darkMode={darkMode}
                />
              )}

              {activeTab === 'my-reports' && (
                <CitizenMyReportsView
                  darkMode={darkMode}
                  onOpenNewReport={() => setActiveTab('report')}
                />
              )}

              {activeTab === 'rescue' && (
                <CitizenRescueRequestView
                  darkMode={darkMode}
                  onBack={() => setActiveTab('citizen-home')}
                />
              )}

              {activeTab === 'citizen-alerts' && (
                <CitizenAlertsView darkMode={darkMode} />
              )}

              {activeTab === 'emergency-help' && (
                <CitizenEmergencyHelpView
                  darkMode={darkMode}
                  onNavigateTab={handleNavigateTab}
                />
              )}

              {activeTab === 'citizen-settings' && (
                <CitizenSettingsView
                  darkMode={darkMode}
                  onToggleDarkMode={() => setDarkMode(!darkMode)}
                  currentUser={currentUser}
                  onUpdateUser={(updated) => setCurrentUser(updated)}
                />
              )}
            </>
          )}

          {/* ================= AUTHORITY VIEWS ================= */}
          {!isCitizen && (
            <>
              {(activeTab === 'dashboard' || activeTab === 'overview') && (
                <OverviewDashboard
                  onNavigateTab={handleNavigateTab}
                  onSelectHabitationForRelocation={(hab) => {
                    setSelectedHabitationForRelocation(hab);
                    setActiveTab('relocation');
                  }}
                  darkMode={darkMode}
                />
              )}

              {activeTab === 'map' && (
                <HazardMapView
                  darkMode={darkMode}
                  onSelectHabitationForRelocation={(hab) => {
                    setSelectedHabitationForRelocation(hab);
                    setActiveTab('relocation');
                  }}
                  onNavigateTab={handleNavigateTab}
                />
              )}

              {activeTab === 'habitations' && (
                <HabitationsView
                  onSelectForRelocation={(hab) => {
                    setSelectedHabitationForRelocation(hab);
                    setActiveTab('relocation');
                  }}
                  onNavigateTab={handleNavigateTab}
                  darkMode={darkMode}
                />
              )}

              {activeTab === 'capacity' && (
                <CarryingCapacityView
                  onNavigateTab={handleNavigateTab}
                  onSelectSafeZoneForRelocation={(sz) => {
                    setSelectedSafeZoneForRelocation(sz);
                    setActiveTab('relocation');
                  }}
                  darkMode={darkMode}
                />
              )}

              {activeTab === 'relocation' && (
                <RelocationEngineView
                  initialHabitation={selectedHabitationForRelocation}
                  initialSafeZone={selectedSafeZoneForRelocation}
                  darkMode={darkMode}
                />
              )}

              {activeTab === 'incidents' && (
                <IncidentsView darkMode={darkMode} />
              )}

              {activeTab === 'alerts' && (
                <AlertsView darkMode={darkMode} />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView darkMode={darkMode} />
              )}

              {activeTab === 'copilot' && (
                <CopilotView
                  onNavigateTab={handleNavigateTab}
                  darkMode={darkMode}
                />
              )}

              {activeTab === 'whatif' && (
                <SimulationSandboxView
                  onNavigateTab={handleNavigateTab}
                  darkMode={darkMode}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView darkMode={darkMode} />
              )}
            </>
          )}
        </main>
      </div>

      {/* 3. ResQZone Official App Footer */}
      <footer className={`py-3 px-4 sm:px-6 border-t flex flex-col sm:flex-row items-center justify-between text-xs font-mono gap-2 shrink-0 select-none z-20 ${
        darkMode ? 'bg-[#060b13] border-slate-800/80 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center gap-2.5">
          <ResQZoneLogo variant="symbol" size="xs" />
          <span className="font-black text-slate-900 dark:text-white tracking-wider">
            RES<span className="text-rose-500">Q</span>ZONE
          </span>
          <span className="text-slate-500 hidden md:inline text-[11px] font-sans">
            • Intelligent Hazard Red Zone &amp; Relocation Engine
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
            Prototype Simulation
          </span>
          <span>•</span>
          <span>National Census Geospatial Baseline</span>
          <span>•</span>
          <span className="text-rose-500 font-bold">Safer People. Safer Communities.</span>
        </div>
      </footer>

      {/* Global Real-time Floating Incident & Rescue Alert Toasts */}
      <RealtimeToastNotifier
        darkMode={darkMode}
        onNavigateTab={handleNavigateTab}
      />

      {/* Citizen AI Safety Assistant Modal */}
      <CitizenAiAssistantModal
        isOpen={isCitizenAiOpen}
        onClose={() => setIsCitizenAiOpen(false)}
        darkMode={darkMode}
        onNavigateTab={handleNavigateTab}
      />
    </div>
  );
}
