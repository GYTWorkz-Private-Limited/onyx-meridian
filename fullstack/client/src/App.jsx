import React, { useState, useEffect, useRef } from 'react';
import { USERS } from './data/store.js';
import { ROUTES, routesFor, canAccess } from './data/nav.js';
import * as Pages from './pages/index.jsx';
import { Avatar, Denied, useToast } from './components/ui.jsx';
import VoiceInput from './components/VoiceInput.jsx';
import { Logo } from './components/Logo.jsx';
import { useStore } from './data/StoreContext.jsx';
import { LayoutDashboard, CheckSquare, MessageSquare, Building2, Building, Globe, Bot, Kanban, ShieldCheck, Rocket, GitBranch, Plug, Network, DollarSign, TrendingUp, Users as UsersIcon, Scale, Settings as SettingsIcon, ChevronDown, Boxes, LogOut, PanelLeftClose, PanelLeftOpen, Activity, Share2, Target, FolderKanban, Cpu, Check } from 'lucide-react';

const ICON_MAP = {
  LayoutDashboard, CheckSquare, MessageSquare, Building2, Building, Globe, Bot, Kanban,
  ShieldCheck, Rocket, GitBranch, Plug, Network, DollarSign, TrendingUp,
  Users: UsersIcon, Scale, Settings: SettingsIcon, Boxes,
  Activity, Share2, Target, FolderKanban, Cpu
};

const ROLE_META = {
  member: { color: '#3d93cc', label: 'Member' },
  head:   { color: '#7c3aed', label: 'Dept Head' },
  admin:  { color: '#0d9488', label: 'Admin' },
};

// Demo credentials: username decides the persona; any password is accepted.
const USERNAME_MAP = {
  'admin': 'admin-1',
  'member': 'member-1',
  'department-head': 'head-1',
  'dept-head': 'head-1',
  'head': 'head-1',
};

const GoogleMark = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-2.8-.4-4H24v7.3h12.1c-.2 1.7-1.6 4.4-4.5 6.2l-.04.3 6.5 5 .45.05c4.1-3.8 6.5-9.4 6.5-15.85z" />
    <path fill="#34A853" d="M24 46c5.9 0 10.9-1.9 14.5-5.3l-6.9-5.3c-1.9 1.3-4.3 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-.26.02-6.7 5.2-.1.25C8 40.7 15.4 46 24 46z" />
    <path fill="#FBBC05" d="M11.5 28.5c-.5-1.4-.7-2.9-.7-4.5s.3-3.1.7-4.5l-.01-.3-6.8-5.3-.22.1A21.9 21.9 0 0 0 2 24c0 3.6.9 6.9 2.4 9.8l7.1-5.3z" />
    <path fill="#EA4335" d="M24 9.5c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.3 29.9 1 24 1 15.4 1 8 6.3 4.4 14.2l7.1 5.3C13.3 14.3 18.2 9.5 24 9.5z" />
  </svg>
);

const MicrosoftMark = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 23 23" aria-hidden="true">
    <path fill="#F25022" d="M1 1h10v10H1z" />
    <path fill="#7FBA00" d="M12 1h10v10H12z" />
    <path fill="#00A4EF" d="M1 12h10v10H1z" />
    <path fill="#FFB900" d="M12 12h10v10H12z" />
  </svg>
);

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const resolve = (name) => USERNAME_MAP[name.trim().toLowerCase()] || null;

  const submit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter your username and password.');
      return;
    }
    const id = resolve(username);
    if (!id) {
      setError('Incorrect username or password.');
      return;
    }
    onLogin(id);
  };

  const sso = (provider) => {
    // SSO is mocked — sign in with the typed username if valid, else default to member.
    onLogin(resolve(username) || 'member-1');
  };

  return (
    <div className="login-screen">
      <div className="flex items-center gap-3 text-white mb-8">
        <Logo size={32} />
        <h1 className="text-white m-0" style={{ fontSize: 28, letterSpacing: '-0.02em' }}>Meridian</h1>
      </div>

      <form className="login-form" onSubmit={submit}>
        <div className="login-form-title">Sign in to your workspace</div>
        <div className="login-form-sub">Welcome back. Please enter your credentials to continue.</div>

        <label className="login-label">Username</label>
        <input
          className="login-input"
          type="text"
          autoFocus
          autoComplete="username"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError(''); }}
        />

        <label className="login-label">Password</label>
        <input
          className="login-input"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
        />

        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="btn btn-primary w-full" style={{ marginTop: 6 }}>Sign in</button>

        <div className="login-divider"><span>or continue with</span></div>

        <div className="flex gap-3">
          <button type="button" className="login-sso" onClick={() => sso('google')}>
            <GoogleMark /> Google
          </button>
          <button type="button" className="login-sso" onClick={() => sso('microsoft')}>
            <MicrosoftMark /> Microsoft
          </button>
        </div>
      </form>
    </div>
  );
}

function UserMenu({ currentUser, userId, onSwitch, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const meta = ROLE_META[currentUser.role];

  return (
    <div className="relative" ref={ref}>
      <div className="usermenu-trigger" onClick={() => setOpen(o => !o)}>
        <Avatar initials={currentUser.avatar} photo={currentUser.photo} size={30} />
        <div className="text-left" style={{ lineHeight: 1.15 }}>
          <div className="text-sm font-semibold">{currentUser.name}</div>
          <div className="text-xs" style={{ color: meta.color }}>{meta.label}</div>
        </div>
        <ChevronDown size={15} className="text-gray-400" />
      </div>

      {open && (
        <div className="usermenu">
          <div className="usermenu-head">
            <div className="flex items-center gap-3">
              <Avatar initials={currentUser.avatar} photo={currentUser.photo} size={38} />
              <div>
                <div className="font-semibold text-white">{currentUser.name}</div>
                <div className="text-xs" style={{ color: '#b9d6ea' }}>{currentUser.title} · {currentUser.dept || 'Org-Wide'}</div>
              </div>
            </div>
          </div>
          <div className="usermenu-item text-red-600 font-medium" onClick={onSignOut}>
            <LogOut size={16} /> Sign out
          </div>
        </div>
      )}
    </div>
  );
}

function CompanySwitcher({ onManage }) {
  const { companies, companyId, currentCompany, switchCompany } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  if (!currentCompany) return null;
  return (
    <div className="relative" ref={ref}>
      <div className="company-switcher" onClick={() => setOpen(o => !o)} title="Switch company">
        <span className="company-mark sm"><Building size={14} /></span>
        <div className="text-left" style={{ lineHeight: 1.1 }}>
          <div className="text-sm font-semibold">{currentCompany.name}</div>
          <div className="text-xs text-gray-400 capitalize">{currentCompany.domain}</div>
        </div>
        <ChevronDown size={14} className="text-gray-400" />
      </div>
      {open && (
        <div className="company-menu">
          <div className="company-menu-label">Companies</div>
          {companies.map(c => (
            <div key={c.id} className={`company-menu-item ${c.id === companyId ? 'active' : ''}`} onClick={() => { switchCompany(c.id); setOpen(false); }}>
              <span className="company-mark sm"><Building size={13} /></span>
              <div className="flex-1">
                <div className="text-sm font-medium">{c.name}</div>
                <div className="text-xs text-gray-400 capitalize">{c.domain}</div>
              </div>
              {c.id === companyId && <Check size={15} className="text-teal-600" />}
            </div>
          ))}
          {onManage && (
            <div className="company-menu-foot" onClick={() => { onManage(); setOpen(false); }}>
              <Building size={14} /> Manage companies
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SignInLoader() {
  return (
    <div className="login-screen signin-loader">
      <div className="flex items-center gap-3 text-white mb-8">
        <Logo size={32} />
        <h1 className="text-white m-0" style={{ fontSize: 28, letterSpacing: '-0.02em' }}>Meridian</h1>
      </div>
      <div className="signin-spinner" />
      <div className="signin-loader-text">Signing you in…</div>
    </div>
  );
}

export default function App() {
  const [userId, setUserId] = useState(null);
  const [signingIn, setSigningIn] = useState(false);
  const [route, setRoute] = useState('dashboard');
  const [navParams, setNavParams] = useState(null);
  const [sideCollapsed, setSideCollapsed] = useState(() => {
    try { return localStorage.getItem('sideCollapsed') === '1'; } catch { return false; }
  });
  const toggleSide = () => setSideCollapsed(c => {
    const next = !c;
    try { localStorage.setItem('sideCollapsed', next ? '1' : '0'); } catch {}
    return next;
  });
  const { toast, ToastContainer } = useToast();
  const go = (r, params = null) => { setNavParams(params); setRoute(r); };

  // Sign-in shows a brief branded loader before the workspace appears.
  const handleLogin = (id) => {
    setSigningIn(true);
    window.setTimeout(() => { setUserId(id); setSigningIn(false); }, 2000);
  };

  // Global affordance: clicking any .btn briefly shows a spinner in place of its
  // label, signalling the action is processing. Delegated so every button —
  // current and future — gets it without per-call wiring.
  useEffect(() => {
    const onClick = (e) => {
      const btn = e.target.closest?.('.btn');
      if (!btn || btn.disabled || btn.classList.contains('btn-loading')) return;
      btn.classList.add('btn-loading');
      window.setTimeout(() => btn.classList.remove('btn-loading'), 700);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  if (signingIn) return <SignInLoader />;
  if (!userId) return <Login onLogin={handleLogin} />;

  const currentUser = USERS.find(u => u.id === userId);
  const role = currentUser.role;

  const handleSwitchUser = (newId) => {
    const newUser = USERS.find(u => u.id === newId);
    setUserId(newId);
    if (!canAccess(newUser.role, route)) setRoute('dashboard');
  };

  const navGroups = ['Workspace', 'Operate', 'Direct', 'Build', 'Govern'];
  const userRoutes = routesFor(role);
  const PageComponent = Object.values(Pages).find(P => P.name.toLowerCase() === route.replace(/-/g, '')) || Pages.Dashboard;

  return (
    <div className={`app ${sideCollapsed ? 'side-collapsed' : ''}`}>
      <div className="side">
        <div className="side-head">
          <span className="side-logo flex-shrink-0"><Logo size={24} /></span>
          <div className="side-brand font-bold text-lg tracking-tight">Meridian</div>
          <button className="side-toggle" onClick={toggleSide} title={sideCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label={sideCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {sideCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-6">
          {navGroups.map(group => {
            const groupRoutes = userRoutes.filter(r => r.group === group);
            if (groupRoutes.length === 0) return null;
            return (
              <div key={group} className="mb-2">
                <div className="nav-group-label">{group}</div>
                {groupRoutes.map(r => {
                  const Icon = ICON_MAP[r.icon] || LayoutDashboard;
                  return (
                    <div key={r.id} className={`nav-item ${route === r.id ? 'active' : ''}`} onClick={() => setRoute(r.id)} title={sideCollapsed ? r.label : undefined}>
                      <Icon size={18} className="flex-shrink-0" />
                      <span>{r.label}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="main">
        <div className="topbar">
          <div className="font-medium text-gray-500 capitalize">
            {ROUTES.find(r => r.id === route)?.group} / <span className="text-gray-900">{ROUTES.find(r => r.id === route)?.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <CompanySwitcher onManage={() => canAccess(role, 'companies') && setRoute('companies')} />
            <UserMenu currentUser={currentUser} userId={userId} onSwitch={handleSwitchUser} onSignOut={() => setUserId(null)} />
          </div>
        </div>

        <div className="content">
          {canAccess(role, route)
            ? <PageComponent user={currentUser} role={role} go={go} toast={toast} navParams={navParams} />
            : <Denied />}
        </div>
      </div>
      <VoiceInput />
      <ToastContainer />
    </div>
  );
}
