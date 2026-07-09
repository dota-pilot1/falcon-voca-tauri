import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { WEB_HEADER_MENUS, PROFILE_MENU, canAccessMenu, type WebMenu, type WebMenuId } from "./model/navigation";
import { LoginScreen } from "../features/auth/login/LoginScreen";
import { login, logout, signup } from "../features/auth/api/authApi";
import { useAuthSession } from "../features/auth/model/useAuthSession";
import { defaultApiUrl, unauthorizedEventName } from "../shared/api/client";
import { AppSidebar } from "../widgets/app-shell/ui/AppSidebar";
import { AppTopbar } from "../widgets/app-shell/ui/AppTopbar";
import { VocabularyListView } from "../pages/vocabulary-list/ui/VocabularyListView";
import { VocabularyQuizView } from "../pages/vocabulary-quiz/ui/VocabularyQuizView";
import { useAppUpdate } from "../shared/lib/useAppUpdate";
import { AppUpdatePanel } from "../shared/ui/AppUpdatePanel";

const appVersion = "0.1.17";

type ConnectionStatus = "checking" | "online" | "offline";
type AppUpdateControls = ReturnType<typeof useAppUpdate>;

export function App() {
  const apiUrl = defaultApiUrl;
  const { token, user, setToken, setRefreshToken, setUser } = useAuthSession();
  const [activeMenu, setActiveMenu] = useState<WebMenuId>("vocabulary");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("checking");
  const appUpdate = useAppUpdate(appVersion);
  const isLoggedIn = token.trim().length > 0 && user !== null;
  const activeWebMenu = useMemo(
    () => [...WEB_HEADER_MENUS, PROFILE_MENU].find((menu) => menu.id === activeMenu) ?? WEB_HEADER_MENUS[0],
    [activeMenu]
  );
  const canAccessActiveMenu = canAccessMenu(user, activeMenu);

  useEffect(() => {
    const clearExpiredSession = () => {
      setToken("");
      setRefreshToken("");
      setUser(null);
      setActiveMenu("vocabulary");
    };
    window.addEventListener(unauthorizedEventName, clearExpiredSession);
    return () => window.removeEventListener(unauthorizedEventName, clearExpiredSession);
  }, [setRefreshToken, setToken, setUser]);

  useEffect(() => {
    let cancelled = false;
    setConnectionStatus("checking");
    void fetch(`${apiUrl}/actuator/health`)
      .then((response) => {
        if (!cancelled) setConnectionStatus(response.ok ? "online" : "offline");
      })
      .catch(() => {
        if (!cancelled) setConnectionStatus("offline");
      });
    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const timer = window.setTimeout(() => {
      appUpdate.checkOnceOnStartup();
    }, 10_000);
    return () => window.clearTimeout(timer);
  }, [appUpdate.checkOnceOnStartup, isLoggedIn]);

  const handleLogin = async (email: string, password: string) => {
    const data = await login(apiUrl, email, password);
    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
    setActiveMenu("vocabulary");
  };

  const handleSignup = async (email: string, username: string, password: string) => {
    await signup(apiUrl, email, username, password);
  };

  const handleLogout = async () => {
    await logout(apiUrl, token);
    setToken("");
    setRefreshToken("");
    setUser(null);
    setActiveMenu("vocaQuiz");
  };

  const openMenu = (menu: WebMenuId) => {
    if (!canAccessMenu(user, menu)) return;
    setActiveMenu(menu);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} onSignup={handleSignup} />;
  }

  return (
    <main className="app-shell">
      <AppSidebar
        menus={WEB_HEADER_MENUS}
        activeMenu={activeMenu}
        activeWebMenu={activeWebMenu}
        user={user}
        connectionStatus={connectionStatus}
        appVersion={appUpdate.state.currentVersion}
        updateState={appUpdate.state}
        updateBusy={appUpdate.busy}
        onOpenMenu={openMenu}
        onInstallUpdate={() => void appUpdate.installUpdate()}
        onLogout={() => void handleLogout()}
      />

      <div className="app-content">
        <AppTopbar activeMenu={activeMenu} activeWebMenu={activeWebMenu} />
        {canAccessActiveMenu ? (
          <FalconWorkspace activeMenu={activeMenu} userName={user.username || user.email} apiUrl={apiUrl} token={token} appUpdate={appUpdate} />
        ) : (
          <ForbiddenView menu={activeWebMenu} />
        )}
      </div>
    </main>
  );
}

function FalconWorkspace({ activeMenu, userName, apiUrl, token, appUpdate }: { activeMenu: WebMenuId; userName: string; apiUrl: string; token: string; appUpdate: AppUpdateControls }) {
  if (activeMenu === "vocabulary") return <VocabularyListView apiUrl={apiUrl} token={token} />;
  if (activeMenu === "vocaQuiz") return <VocabularyQuizView apiUrl={apiUrl} token={token} />;
  if (activeMenu === "profile") return <ProfileView userName={userName} appUpdate={appUpdate} />;
  if (activeMenu === "settings") return <SettingsView />;
  return <VocabularyListView apiUrl={apiUrl} token={token} />;
}

function ProfileView({ userName, appUpdate }: { userName: string; appUpdate: AppUpdateControls }) {
  return (
    <SimpleGridView
      title="프로필"
      description={`${userName} 계정으로 Falcon Voca에 로그인되어 있습니다.`}
      items={["학습 서버 연결", "계정 정보", `앱 버전 v${appUpdate.state.currentVersion}`]}
    >
      <AppUpdatePanel
        updateState={appUpdate.state}
        busy={appUpdate.busy}
        onCheckUpdate={() => void appUpdate.checkForUpdate()}
        onInstallUpdate={() => void appUpdate.installUpdate()}
      />
    </SimpleGridView>
  );
}

function SettingsView() {
  return (
    <SimpleGridView
      title="설정"
      description="퀴즈 난이도, 서버 연결 같은 앱 환경을 배치할 영역입니다."
      items={["문항 수 10개", "기본 난이도 전체", "서버 연결 상태 표시"]}
    />
  );
}

function SimpleGridView({ title, description, items, children }: { title: string; description: string; items: string[]; children?: ReactNode }) {
  return (
    <section className="falcon-view">
      <div className="falcon-inner">
        <header className="falcon-page-head">
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
        </header>
        <div className="simple-card-grid">
          {items.map((item) => (
            <article className="simple-card" key={item}>
              <CheckCircle2 size={18} />
              <strong>{item}</strong>
            </article>
          ))}
        </div>
        {children}
      </div>
    </section>
  );
}

function ForbiddenView({ menu }: { menu: WebMenu }) {
  const Icon = menu.icon;
  return (
    <section className="feature-placeholder">
      <div className="feature-placeholder-box">
        <div className="empty-icon warning">
          <CircleAlert size={26} />
        </div>
        <h1>{menu.label}</h1>
        <p>이 메뉴를 열 수 없습니다. 로그인 상태를 확인해주세요.</p>
        <span>
          <Icon size={15} />
          {menu.subtitle}
        </span>
      </div>
    </section>
  );
}
