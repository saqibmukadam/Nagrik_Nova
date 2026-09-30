import ARReporter from "./ARReporter";
import VRCommandCenter from "./VRCommandCenter";
import VoiceInput from "./VoiceInput.jsx";
import React, { useEffect, useState } from "react";
import AIChatWidget from "./AIChatWidget.jsx";
import IssueScanner from "./IssueScanner.jsx";
import { createRoot } from "react-dom/client";
import Rewards from "./Rewards";
import AccountSettings from "./AccountSettings.jsx";
import { NotFound, ServerError, SessionExpiredModal } from './UXStates';
import { PrivacyPolicy, TermsOfService, CommunityGuidelines } from "./Legal";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import axios from "axios";
import {
  ArrowRight,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Leaf,
  LoaderCircle,
  MapPin,
  Plus,
  Sparkles,
  Users,
  Camera,
  Moon, 
  Sun,
  HandHeart,
  ThumbsUp,
  ClipboardList,
  Wrench,
  Eye,
  EyeOff,
  // INSTAGRAM NAV ICONS
  Home as HomeIcon,
  Map as MapIcon,
  PlusSquare,
  Gift,
  User as UserIcon,
  LogOut
} from "lucide-react";
import "./styles.css";
import CitizenMap from "./CitizenMap.jsx";
import Footer from "./Footer";

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((c) => {
  const t = localStorage.getItem("nn-token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.dispatchEvent(new Event("session-expired"));
    }
    return Promise.reject(error);
  }
);

// --- INDIAN STATES & CITIES DATA DICTIONARY ---
const indiaData = {
  "Andaman and Nicobar Islands": ["Port Blair"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Pasighat", "Ziro"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur"],
  "Chandigarh": ["Chandigarh"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Mandi"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur"],
  "Ladakh": ["Leh", "Kargil"],
  "Lakshadweep": ["Kavaratti"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad", "Talegaon Dabhade", "Pimpri-Chinchwad"],
  "Manipur": ["Imphal", "Churachandpur", "Thoubal"],
  "Meghalaya": ["Shillong", "Tura", "Jowai"],
  "Mizoram": ["Aizawl", "Lunglei", "Champhai"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Brahmapur"],
  "Puducherry": ["Pondicherry", "Auroville", "Yanam"],
  "Punjab": ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"],
  "Sikkim": ["Gangtok", "Namchi", "Pelling"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
  "Tripura": ["Agartala", "Dharmanagar", "Udaipur"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Noida", "Prayagraj"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Rishikesh"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Asansol"]
};

const useAuth = () => {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("nn-user") || "null"),
  );

  const updateUser = (updatedUser) => {
    localStorage.setItem("nn-user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const signIn = (d) => {
    localStorage.setItem("nn-token", d.token);
    localStorage.setItem("nn-user", JSON.stringify(d.user));
    setUser(d.user);
  };
  
  const out = () => {
    localStorage.removeItem("nn-token");
    localStorage.removeItem("nn-user");
    setUser(null);
  };
  return { user, signIn, updateUser, out };
};

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('nn-dark-mode') === 'true';
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('nn-dark-mode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('nn-dark-mode', 'false');
    }
  }, [isDark]);

  return (
    <button 
      onClick={() => setIsDark(!isDark)}
      className="btn small"
      style={{ 
        background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(24, 41, 55, 0.85)',
        padding: '10px 14px',
        color: '#fff'
      }}
      title="Toggle Dark Mode"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

function CursorCompanion() {
  const companionRef = React.useRef(null);

  React.useEffect(() => {
    const moveCompanion = (e) => {
      if (companionRef.current) {
        companionRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };
    window.addEventListener('mousemove', moveCompanion);
    return () => window.removeEventListener('mousemove', moveCompanion);
  }, []);

  return (
    <div ref={companionRef} className="cursor-companion">
      <Leaf size={18} strokeWidth={2.5} />
    </div>
  );
}

function App() {
  const auth = useAuth();
  const nav = useNavigate();
  const { user } = auth;
  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => {
    const handleExpired = () => {
      auth.out(); 
      setShowExpired(true);
    };
    window.addEventListener("session-expired", handleExpired);
    return () => window.removeEventListener("session-expired", handleExpired);
  }, [auth]);

  return (
    <>
      {showExpired && (
        <SessionExpiredModal onLoginClick={() => {
          setShowExpired(false);
          nav("/login");
        }} />
      )}
      
      <CursorCompanion />
      <Nav auth={auth} />
      
      <main>
        <Routes>
          <Route path="/" element={<Home user={auth.user} />} />
          <Route path="/vr-map" element={<Require user={auth.user}><VRCommandCenter /></Require>} />
          <Route path="/login" element={<Login auth={auth} />} />
          <Route path="/register" element={<Register auth={auth} />} />
          
          <Route path="/issues" element={<Require user={auth.user}><Issues /></Require>} />
          <Route path="/rewards" element={<Require user={auth.user}><Rewards user={auth.user} auth={auth} /></Require>} />
          <Route path="/issues/:id" element={<Require user={auth.user}><Detail user={auth.user} /></Require>} />
          <Route path="/citizen-map" element={<Require user={auth.user}><CitizenMap /></Require>} />
          <Route path="/dashboard" element={<Require user={auth.user}><Dashboard user={auth.user} auth={auth} /></Require>} />
          <Route path="/settings" element={<Require user={auth.user}><AccountSettings user={auth.user} auth={auth} /></Require>} />
          
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/guidelines" element={<CommunityGuidelines />} />
          <Route path="/500" element={<ServerError />} />
          <Route path="*" element={<NotFound />} />

          <Route
            path="/admin"
            element={
              user?.role === "admin"
                ? <AdminDashboard />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/organization"
            element={
              user &&
                ["university", "industry", "ngo"].includes(user.role) ? (
                <OrganizationDashboard user={user} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </main>

      <AIChatWidget />
      <Footer />
    </>
  );
}

function Require({ user, children }) {
  return user ? children : <Navigate to="/login" replace />;
}

function Nav({ auth }) {
  const getAddRoute = () => {
    if (!auth.user) return "/login";
    if (auth.user.role === "admin") return "/admin";
    if (["university", "industry"].includes(auth.user.role)) return "/organization";
    return "/dashboard";
  };

  return (
    <header>
      {/* --- MOBILE TOP BAR: LEFT (Dark Mode & VR Center for Admins) --- */}
      <div className="mobile-only mobile-top-left" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <DarkModeToggle />
        
        {/* NEW: Admin-only VR Command Center Mobile Access */}
        {auth.user && auth.user.role === "admin" && (
          <NavLink 
            to="/vr-map" 
            title="VR Command Center" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '6px', 
              background: 'rgba(16, 185, 129, 0.15)', 
              borderRadius: '8px', 
              color: '#10b981', 
              border: '1px solid rgba(16, 185, 129, 0.4)' 
            }}
          >
            <Sparkles size={18} />
          </NavLink>
        )}
      </div>

      {/* --- MOBILE TOP BAR: CENTER (Brand) --- */}
      <Link className="brand" to="/">
        <span className="brand-mark">
          <Leaf size={20} />
        </span>
        <span>
          Nagrik <i>Nova</i>
        </span>
      </Link>

      {/* --- MOBILE TOP BAR: RIGHT (Coins & Logout) --- */}
      <div className="mobile-only mobile-top-right">
        {auth.user ? (
          <>
            <div className="coin-bubble" style={{ padding: '4px 8px', fontSize: '12px' }}>
              <Sparkles size={12} />
              {auth.user.nova_coins || 0}
            </div>
            <button className="text-btn" onClick={auth.out} style={{ padding: 0 }}>
              <LogOut size={20} className="mobile-icon-color" />
            </button>
          </>
        ) : (
          <div style={{width: '20px'}}></div> /* Empty spacer for balance */
        )}
      </div>

      <nav>
        {/* 1. Explore Issues (Home Icon) */}
        <NavLink to="/issues" style={{ order: 1 }}>
          <HomeIcon className="nav-icon" />
          <span className="nav-text">Explore issues</span>
        </NavLink>
        
        {/* 2. Live Map (Map Icon) */}
        <NavLink to="/citizen-map" style={{ order: 2 }}>
          <MapIcon className="nav-icon" />
          <span className="nav-text">Live Map</span>
        </NavLink>

        {/* 3. Center ADD Button (Admin goes to Admin Dashboard) */}
        <NavLink to={getAddRoute()} className="mobile-only mobile-add-btn" style={{ order: 3 }}>
          <PlusSquare className="nav-icon" />
        </NavLink>

        {/* 4. Rewards (Gift Icon) */}
        <NavLink to="/rewards" style={{ order: 4 }}>
          <Gift className="nav-icon" />
          <span className="nav-text">Rewards</span>
        </NavLink>

        {/* 5. Profile Settings (Mobile Only User Icon/Avatar) */}
        <NavLink to={auth.user ? "/settings" : "/login"} className="mobile-only profile-nav" style={{ order: 5 }}>
          {auth.user ? (
            <span className="user-dot nav-icon" style={{ width: 26, height: 26, fontSize: '10px', margin: 0, padding: 0 }}>
              {auth.user.name.split(" ").map((x) => x[0]).slice(0, 2)}
            </span>
          ) : (
            <UserIcon className="nav-icon" />
          )}
        </NavLink>

        {/* --- DESKTOP EXCLUSIVE LINKS --- */}
        <div className="desktop-only" style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
          {auth.user && ["citizen", "ngo"].includes(auth.user.role) && (
            <NavLink to="/dashboard">My dashboard</NavLink>
          )}

          {auth.user && ["university", "industry", "ngo"].includes(auth.user.role) && (
            <NavLink to="/organization">My Challenges</NavLink>
          )}
            
          {auth.user && auth.user.role === "admin" && (
            <>
              <NavLink to="/admin">Admin</NavLink>
              <NavLink to="/vr-map" className="vr-link">
                <Sparkles size={15} /> VR Command Center
              </NavLink>
            </>
          )}
          
          <DarkModeToggle />
          
          {auth.user ? (
            <div className="nav-user" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <div className="coin-bubble" title="Nova Coins">
                <Sparkles size={15} />
                {auth.user.nova_coins || 0}
              </div>

              <span className="user-dot">
                {auth.user.name.split(" ").map((x) => x[0]).slice(0, 2)}
              </span>

              <Link to="/settings" className="text-btn" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Wrench size={14} /> Settings
              </Link>

              <button className="text-btn" onClick={auth.out}>
                Sign out
              </button>
            </div>
          ) : (
            <div className="nav-auth" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <Link to="/login">Sign in</Link>
              <Link className="btn small" to="/register">
                Join the network <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

function Home({ user }) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={15} /> Civic intelligence, made collective
          </div>
          <h1>
            Big civic change starts with <em>one shared signal.</em>
          </h1>
          <p>
            Nagrik Nova connects community-reported challenges with the people,
            research and resources ready to solve them.
          </p>
          <div className="hero-actions">
            <Link className="btn" to={user ? "/issues" : "/register"}>
              {user ? "Explore live issues" : "Become a changemaker"}{" "}
              <ArrowRight size={17} />
            </Link>
            <a className="link-action" href="#how">
              See how it works <ChevronRight size={17} />
            </a>
          </div>
          <div className="trust">
            <span>
              <CheckCircle2 /> Community-led
            </span>
            <span>
              <CheckCircle2 /> AI-assisted
            </span>
            <span>
              <CheckCircle2 /> Outcome-focused
            </span>
          </div>
        </div>
        <div className="hero-art quiet-art" aria-label="Animated collaboration illustration">
          <div className="constellation-lines"></div>
          <div className="constellation-core"><BrainCircuit size={48} /><span>Ideas in action</span></div>
          <div className="constellation-node node-a"><span></span></div>
          <div className="constellation-node node-b"><span></span></div>
          <div className="constellation-node node-c"><span></span></div>
          <div className="constellation-label label-a">Community</div>
          <div className="constellation-label label-b">Research</div>
          <div className="constellation-label label-c">Industry</div>
          <div className="constellation-caption"><Sparkles size={16} /> Collaboration creates momentum</div>
        </div>
      </section>
      <section className="impact-strip">
        <div>
          <strong>01</strong>
          <span>Report what matters</span>
        </div>
        <div>
          <strong>02</strong>
          <span>Understand the challenge</span>
        </div>
        <div>
          <strong>03</strong>
          <span>Connect the right minds</span>
        </div>
        <div>
          <strong>04</strong>
          <span>Build local impact</span>
        </div>
      </section>
      <section id="how" className="how">
        <div className="section-intro">
          <div className="eyebrow">
            <Leaf size={15} /> From a concern to a solution
          </div>
          <h2>
            One platform. Many hands.
            <br />
            <em>Real progress.</em>
          </h2>
        </div>
        <div className="steps">
          <Step
            n="01"
            icon={<CircleAlert />}
            title="Share a civic issue"
            text="Citizens and NGOs make local needs visible with a simple, structured report."
          />
          <Step
            n="02"
            icon={<BrainCircuit />}
            title="Turn insight into clarity"
            text="AI identifies the domain, priority and expertise needed to move forward."
          />
          <Step
            n="03"
            icon={<Users />}
            title="Find the right collaborators"
            text="Universities and industry partners are matched to challenges they can help solve."
          />
        </div>
      </section>
    </>
  );
}

function Step(p) {
  return (
    <article className="step">
      <div className="step-top">
        <span>{p.n}</span>
        {p.icon}
      </div>
      <h3>{p.title}</h3>
      <p>{p.text}</p>
    </article>
  );
}

function AuthShell({ title, sub, children }) {
  return (
    <section className="auth-shell">
      <div className="auth-side">
        <div className="eyebrow">
          <Sparkles size={15} /> Join the civic network
        </div>
        <h2>
          Better cities are built <em>together.</em>
        </h2>
        <p>
          Bring lived experience, research and resources into one shared place
          for action.
        </p>
        <div className="quote">
          “A small report can become the beginning of a meaningful local
          change.”
        </div>
      </div>
      <div className="form-panel">
        <h1>{title}</h1>
        <p>{sub}</p>
        {children}
      </div>
    </section>
  );
}

function Login({ auth }) {
  const nav = useNavigate(),
    [data, setData] = useState({ email: "", password: "" }),
    [err, setErr] = useState("");
    
  const go = async (e) => {
    e.preventDefault();
    try {
      auth.signIn((await api.post("/auth/login", { ...data, email: data.email.trim().toLowerCase() })).data);
      nav("/issues");
    } catch (e) {
      setErr(e.response?.data?.message || "Could not sign in.");
    }
  };
  
  return (
    <AuthShell
      title="Welcome back"
      sub="Sign in to continue your civic impact journey."
    >
      <form onSubmit={go}>
        <Field
          label="Email address"
          type="email"
          value={data.email}
          onChange={(e) => setData({ ...data, email: e.target.value })}
        />
        <Field
          label="Password"
          type="password"
          value={data.password}
          onChange={(e) => setData({ ...data, password: e.target.value })}
        />
        {err && <div className="error">{err}</div>}
        <button className="btn full">
          Sign in <ArrowRight size={17} />
        </button>
        <p className="form-foot">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
}

const roleFields = {
  ngo: [
    ["areaOfWork", "Area of work"],
    ["registrationNumber", "Registration number"],
    ["yearsActive", "Years active"],
  ],
  university: [
    ["departments", "Departments (comma-separated)"],
    ["expertise", "Expertise (comma-separated)"],
    ["labsResources", "Labs & resources (comma-separated)"],
    ["interestedDomains", "Interested domains (comma-separated)"],
  ],
  industry: [
    ["industryType", "Industry type"],
    ["expertise", "Expertise (comma-separated)"],
    ["resourcesOffered", "Resources offered (comma-separated)"],
    ["interestedDomains", "Interested domains (comma-separated)"],
  ],
};

function Register({ auth }) {
  const nav = useNavigate(),
    [d, setD] = useState({ role: "citizen" }),
    [err, setErr] = useState("");
    
  const set = (k, v) => setD({ ...d, [k]: v });
  
  const submit = async (e) => {
    e.preventDefault();
    try {
      auth.signIn((await api.post("/auth/register", d)).data);
      nav("/issues");
    } catch (e) {
      setErr(e.response?.data?.message || "Could not create account.");
    }
  };
  
  return (
    <AuthShell
      title="Join Nagrik Nova"
      sub="Create a profile that helps the right people find you."
    >
      <form onSubmit={submit}>
        <label>
          Account type
          <select value={d.role} onChange={(e) => set("role", e.target.value)}>
            {["citizen", "ngo", "university", "industry"].map((x) => (
              <option key={x} value={x}>
                {x[0].toUpperCase() + x.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <Field
          label={d.role === "citizen" ? "Your name" : "Organisation name"}
          value={d.name || ""}
          onChange={(e) => set("name", e.target.value)}
        />
        <div className="two">
          <Field
            label="Email address"
            type="email"
            value={d.email || ""}
            onChange={(e) => set("email", e.target.value)}
          />
          <Field
            label="Phone"
            required={false}
            value={d.phone || ""}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
        <Field
          label="Address"
          required={false}
          value={d.address || ""}
          onChange={(e) => set("address", e.target.value)}
        />
        <Field
          label="Create password"
          type="password"
          value={d.password || ""}
          onChange={(e) => set("password", e.target.value)}
        />
        {roleFields[d.role]?.map(([key, label]) => (
          <Field
            key={key}
            label={label}
            type={key === "yearsActive" ? "number" : "text"}
            value={d[key] || ""}
            onChange={(e) => set(key, e.target.value)}
          />
        ))}
        {err && <div className="error">{err}</div>}
        <button className="btn full">
          Create my profile <ArrowRight size={17} />
        </button>
        <p className="form-foot">
          Already a member? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}

function Field({ label, type = "text", ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  
  return (
    <label style={{ position: 'relative', display: 'block' }}>
      {label}
      <input 
        required 
        type={isPassword ? (show ? "text" : "password") : type} 
        {...props} 
        style={{ paddingRight: isPassword ? '40px' : '15px', width: '100%' }} 
      />
      {isPassword && (
        <button
          type="button" 
          onClick={() => setShow(!show)}
          style={{ position: 'absolute', right: '12px', bottom: '12px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
          title={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </label>
  );
}

function Issues() {
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true);
    
  useEffect(() => {
    api
      .get("/issues")
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));
  }, []);
  
  return (
    <section className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <Sparkles size={15} /> Community signal board
          </div>
          <h1>
            Issues asking for <em>action.</em>
          </h1>
          <p>
            Explore challenges surfaced by people who know their communities
            best.
          </p>
        </div>
        <Link className="btn" to="/dashboard">
          <Plus size={17} /> Report an issue
        </Link>
      </div>
      {loading ? (
        <Loading />
      ) : (
        <div className="issue-grid">
          {items.map((i) => (
            <IssueCard key={i.id} issue={i} />
          ))}
        </div>
      )}
      {!loading && !items.length && <Empty />}
    </section>
  );
}

function IssueCard({ issue }) {
  return (
    <Link to={`/issues/${issue.id}`} className="issue" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* RENDER IMAGE IF PRESENT */}
      {issue.image_url && (
        <img 
          src={issue.image_url} 
          alt={issue.title} 
          style={{ width: '100%', height: '180px', objectFit: 'cover', borderBottom: '1px solid rgba(255,255,255,0.1)' }} 
        />
      )}
      
      <div style={{ padding: '21px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div className="issue-meta">
          <span className="role">{issue.submitter_role}</span>
          {issue.analyzed ? (
            <span className={`priority ${issue.priority?.toLowerCase()}`}>
              {issue.priority} priority
            </span>
          ) : (
            <span className="pending">Awaiting analysis</span>
          )}
        </div>
        <h3>{issue.title}</h3>
        <p>{issue.description}</p>
        <div className="issue-bottom" style={{ marginTop: 'auto', paddingTop: '15px' }}>
          <span>
            <MapPin size={15} />
            {issue.city}, {issue.state}
          </span>
          <span className="arrow-circle">
            <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Dashboard({ user, auth }) {
  const nav = useNavigate(),
    [issues, setIssues] = useState([]),
    [data, setData] = useState({
      title: "",
      description: "",
      state: "",
      city: "",
      street: "",
      submitted_by: user.id || user._id,
      submitter_role: user.role
    }),
    [voiceResetKey, setVoiceResetKey] = useState(0),
    [msg, setMsg] = useState(""),
    [err, setErr] = useState("");
    
  const [imagePreview, setImagePreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    api
      .get("/issues")
      .then((r) =>
        setIssues(
          r.data.filter((i) => i.submitted_by === (user.id || user._id))
        ),
      );
  }, [user.id, user._id]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement("canvas");

        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        setImagePreview(compressedBase64);
      };
    };
  };

  const runAIVision = async (e) => {
    e.preventDefault();
    if (!imagePreview) return;

    setIsScanning(true);

    try {
      const response = await api.post("/ai/scan", { imageBase64: imagePreview });
      setData({
        ...data,
        title: response.data.title || data.title,
        description: response.data.description || data.description
      });
    } catch (error) {
      console.error("Vision API Error:", error);
      alert("Nova AI couldn't process this image right now. Please enter the details manually.");
    } finally {
      setIsScanning(false);
    }
  };

  const post = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    try {
      const payload = {
        ...data,
        image_url: imagePreview
      };

      const r = await api.post("/issues", payload);

      setIssues((prev) => [r.data.issue, ...prev]);

      setData({
        ...data,
        title: "",
        description: "",
        state: "",
        city: "",
        street: "",
      });
      
      setImagePreview(null);

      if (r.data.new_coins) {
        auth.updateUser({ ...user, nova_coins: r.data.new_coins });
        setMsg("Report accepted! You earned +20 Nova Coins.");
      } else {
        setMsg("Your issue is now visible to the Nagrik Nova network.");
      }

      setVoiceResetKey((prev) => prev + 1);
    } catch (e) {
      const resData = e.response?.data;
      
      if (e.response?.status === 403 || resData?.isBanned) {
        auth.updateUser({ ...user, is_banned: true, strikes: 3 });
      } else if (resData?.strikes) {
        auth.updateUser({ ...user, strikes: resData.strikes });
        setErr(`Warning: ${resData.message}`);
      } else {
        setErr(resData?.message || "Could not submit your report.");
      }
    }
  };
  
  if (!["citizen", "ngo"].includes(user.role)) return <Navigate to="/issues" />;
  
  if (user.is_banned) {
    return (
      <section className="page dashboard">
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '50px 20px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.5)' }}>
          <CircleAlert size={64} color="#ef4444" style={{ margin: '0 auto 20px' }} />
          <h1 style={{ color: '#ef4444', marginBottom: '10px' }}>Account Suspended</h1>
          <p style={{ color: 'var(--muted)', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
            Your account has been permanently suspended for submitting false, spam, or duplicate civic issues 3 or more times. Contact support to appeal.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="page dashboard">
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <Leaf size={15} /> Your neighbourhood, your voice
          </div>
          <h1>
            Make a concern <em>count.</em>
          </h1>
          <p>
            Your report can connect an everyday problem to the right
            problem-solvers.
          </p>
        </div>
      </div>
      <div className="dash-grid">
        <form className="report-form" onSubmit={post}>
          <h2>Report a civic issue</h2>
          <p>
            Be specific. Your details help partners understand where action is
            needed.
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <label className="btn" style={{ flex: 1, cursor: 'pointer', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', display: 'flex', justifyContent: 'center', margin: 0 }}>
              <Camera size={18} style={{ marginRight: '8px' }} /> 
              Snap Live Photo
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={handleImageUpload} 
                style={{ display: 'none' }} 
              />
            </label>

            <label className="btn" style={{ flex: 1, cursor: 'pointer', background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', margin: 0 }}>
              Upload Image
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>

          {imagePreview && (
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>
              <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />

              {isScanning && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(47, 116, 94, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 10 }}>
                  <LoaderCircle className="spin" size={30} style={{ marginBottom: '10px' }} />
                  <strong>Nova AI is scanning...</strong>
                </div>
              )}
            </div>
          )}

          {imagePreview && !isScanning && !data.title && (
            <button
              onClick={runAIVision}
              type="button"
              className="btn full"
              style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981' }}
            >
              <Sparkles size={16} /> Auto-Fill using Nova AI
            </button>
          )}

          <VoiceInput
            key={voiceResetKey}
            data={data}
            setData={setData}
          />
          
          <Field
            label="A clear title"
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
          />
          
          <label>
            What is happening?
            <textarea
              required
              value={data.description}
              onChange={(e) =>
                setData({ ...data, description: e.target.value })
              }
            />
          </label>

          <div className="two">
            <label style={{ position: 'relative', display: 'block' }}>
              State
              <input
                list="states-list"
                required
                placeholder="Type or select a state"
                value={data.state}
                onChange={(e) => setData({ ...data, state: e.target.value, city: "" })} 
                style={{ width: '100%' }}
              />
              <datalist id="states-list">
                {Object.keys(indiaData).map((st) => (
                  <option key={st} value={st} />
                ))}
              </datalist>
            </label>

            <label style={{ position: 'relative', display: 'block' }}>
              City
              <input
                list="cities-list"
                required
                placeholder="Type or select a city"
                value={data.city}
                onChange={(e) => setData({ ...data, city: e.target.value })}
                style={{ width: '100%' }}
              />
              <datalist id="cities-list">
                {indiaData[data.state] && indiaData[data.state].map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
          </div>

          <Field
            label="Exact Street / Landmark / Coordinates"
            value={data.street}
            onChange={(e) => setData({ ...data, street: e.target.value })}
            placeholder="Example: Wakad Main Road"
          />

          <label>Capture exact spatial location (Optional)</label>
          <ARReporter
            onLocationSaved={(coords) => {
              const finalLocation = coords.lat && coords.lng
                ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                : `AR Spatial: [${coords.x.toFixed(2)}, ${coords.z.toFixed(2)}]`;

              setData({ ...data, street: finalLocation });
            }}
          />
          
          {msg && <div className="success">{msg}</div>}
          {err && <div className="error">{err}</div>}
          
          <button className="btn full">
            Submit to the network <ArrowRight size={17} />
          </button>
        </form>
        
        <aside className="my-issues">
          <h2>
            Your reports <span>{issues.length}</span>
          </h2>
          {issues.length ? (
            issues.map((i) => (
              <IssueCard key={i.id} issue={i} />
            ))
          ) : (
            <Empty text="Your submitted issues will appear here." />
          )}

          <div style={{ 
            marginTop: '25px', 
            padding: '20px', 
            background: 'rgba(245, 158, 11, 0.1)', 
            border: '1px solid rgba(245, 158, 11, 0.3)', 
            borderRadius: '12px', 
            display: 'flex', 
            flexDirection: 'column',
            gap: '8px'
          }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706', fontSize: '16px' }}>
              <Sparkles size={18} /> Earn Nova Coins
            </h3>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', color: 'var(--muted)' }}>
              Making a valid civic report will earn you <strong>20 Nova Coins</strong>! Help your community and collect rewards.
            </p>
          </div>
          
        </aside>
      </div>
    </section>
  );
}

function IssueTracker({ issue }) {
  let currentStep = 1;
  if (issue.analyzed) currentStep = 2;
  if (issue.analyzed && issue.matches?.length > 0) currentStep = 3;
  if (issue.status === "in_progress" || issue.status === "In Progress") currentStep = 4; 
  if (issue.status === "resolved" || issue.status === "Completed") currentStep = 5; 

  const stages = [
    { id: 1, name: "Signal Received", icon: <ClipboardList size={18} /> },
    { id: 2, name: "AI Analyzed", icon: <BrainCircuit size={18} /> },
    { id: 3, name: "Partner Matched", icon: <Users size={18} /> },
    { id: 4, name: "In Progress", icon: <Wrench size={18} /> },
    { id: 5, name: "Resolved", icon: <CheckCircle2 size={18} /> }
  ];

  return (
    <div className="civic-tracker">
      <div className="tracker-track">
        {stages.map((stage, index) => {
          const isActive = stage.id <= currentStep;
          const isLast = index === stages.length - 1;
          
          return (
            <React.Fragment key={stage.id}>
              <div className={`tracker-node ${isActive ? "active" : ""}`}>
                <div className="node-icon">{stage.icon}</div>
                <span className="node-label">{stage.name}</span>
              </div>
              {!isLast && (
                <div className={`tracker-line ${stage.id < currentStep ? "active-line" : ""}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function Detail({ user }) {
  const { id } = useParams(),
    [issue, setIssue] = useState(null),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState("");

  const [upvotes, setUpvotes] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [pledges, setPledges] = useState([]);
  const [pledgeText, setPledgeText] = useState("");
  const [showPledgeForm, setShowPledgeForm] = useState(false);

  useEffect(() => {
    api
      .get("/issues/" + id)
      .then((r) => {
        const data = r.data;
        setIssue({
          ...data.issue,
          aiAnalysis: data.aiAnalysis || null,
          matches: data.matches || [],
        });
      })
      .catch(() => setErr("This issue is no longer available."));
  }, [id]);

  useEffect(() => {
    if (issue && id) {
      const loadData = () => {
        const savedPledges = JSON.parse(localStorage.getItem(`nn-pledges-${id}`) || "[]");
        setPledges(savedPledges);
        const savedUpvotes = parseInt(localStorage.getItem(`nn-upvotes-${id}`) || Math.floor(Math.random() * 12) + 2);
        setUpvotes(savedUpvotes);
        const userUpvoted = localStorage.getItem(`nn-upvoted-${id}-${user.id || user._id}`) === "true";
        setHasUpvoted(userUpvoted);
      };
      loadData();
      window.addEventListener("storage", loadData);
      return () => window.removeEventListener("storage", loadData);
    }
  }, [issue, id, user]);

  const analyze = async () => {
    setBusy(true);
    setErr("");

    try {
      const r = await api.post(`/issues/${id}/analyze`);
      setIssue({
        ...r.data.issue,
        aiAnalysis: r.data.analysis,
        matches: [],
      });

      try {
        await api.post(`/issues/${id}/match-organizations`);
        const matchResponse = await api.get(`/issues/${id}`);
        const data = matchResponse.data;

        setIssue({
          ...data.issue,
          aiAnalysis: data.aiAnalysis || r.data.analysis,
          matches: data.matches || [],
        });
      } catch (matchError) {
        console.error("Organization matching failed:", matchError);
      }
    } catch (e) {
      setErr(e.response?.data?.message || "Analysis could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpvote = () => {
    if (!hasUpvoted) {
      const newUpvotes = upvotes + 1;
      setUpvotes(newUpvotes);
      setHasUpvoted(true);
      localStorage.setItem(`nn-upvotes-${id}`, newUpvotes);
      localStorage.setItem(`nn-upvoted-${id}-${user.id || user._id}`, "true");
    }
  };

  const handlePledge = (e) => {
    e.preventDefault();
    if (pledgeText.trim()) {
      const newPledge = { orgName: user.name, text: pledgeText };
      const updatedPledges = [...pledges, newPledge];
      setPledges(updatedPledges);
      localStorage.setItem(`nn-pledges-${id}`, JSON.stringify(updatedPledges));
      window.dispatchEvent(new Event("storage"));
      setPledgeText("");
      setShowPledgeForm(false);
    }
  };

  if (err && !issue) {
    return (
      <section className="page">
        <div className="error">{err}</div>
      </section>
    );
  }

  if (!issue) return <Loading />;

  return (
    <section className="page detail">
      <Link className="back" to="/issues">
        ← Back to issue board
      </Link>

      <div className="detail-top">
        <div>
          <div className="issue-meta">
            <span className="role">{issue.submitter_role}</span>

            {issue.analyzed ? (
              <span
                className={`priority ${issue.priority?.toLowerCase()}`}
              >
                {issue.priority} priority
              </span>
            ) : (
              <span className="pending">
                Awaiting analysis
              </span>
            )}
          </div>

          <h1>{issue.title}</h1>

          <p className="location">
            <MapPin size={17} />
            {issue.street}, {issue.city}, {issue.state}
          </p>
        </div>

        {user.role === "admin" && !issue.analyzed && (
          <button
            className="btn analyze"
            disabled={busy}
            onClick={analyze}
          >
            {busy ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <BrainCircuit size={18} />
            )}{" "}
            {busy ? "Analyzing signal…" : "Analyze with AI"}
          </button>
        )}
      </div>

      {issue.image_url && (
        <div style={{ width: '100%', maxHeight: '450px', borderRadius: '16px', overflow: 'hidden', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <img src={issue.image_url} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <IssueTracker issue={issue} />

      <article className="detail-description">
        <h2>What the community is seeing</h2>
        <p>{issue.description}</p>
      </article>

      <div className="community-impact">
        <div className="impact-header">
          <h3>Community Momentum</h3>
          <span className="upvote-count"><ThumbsUp size={16} /> {upvotes} Citizens Affected</span>
        </div>

        {["citizen", "ngo"].includes(user.role) && (
          <button 
            className={`btn full ${hasUpvoted ? "upvoted" : "upvote-btn"}`} 
            onClick={handleUpvote}
            disabled={hasUpvoted}
          >
            {hasUpvoted ? "✅ You endorsed this issue" : "✋ I am affected by this too"}
          </button>
        )}

        {["university", "industry"].includes(user.role) && (
          <div className="pledge-section">
            {!showPledgeForm ? (
              <button className="btn full pledge-btn" onClick={() => setShowPledgeForm(true)}>
                <HandHeart size={18} /> Pledge Resources or Expertise
              </button>
            ) : (
              <form onSubmit={handlePledge} className="pledge-form">
                <textarea 
                  required 
                  placeholder="E.g., We can donate 5 bags of cement, or our engineering students can survey this..."
                  value={pledgeText}
                  onChange={(e) => setPledgeText(e.target.value)}
                />
                <div className="pledge-actions">
                  <button type="button" className="text-btn" onClick={() => setShowPledgeForm(false)}>Cancel</button>
                  <button type="submit" className="btn small">Submit Pledge</button>
                </div>
              </form>
            )}
          </div>
        )}

        {pledges.length > 0 && (
          <div className="active-pledges">
            <h4>Active Pledges</h4>
            {pledges.map((p, i) => (
              <div key={i} className="pledge-card">
                <strong>{p.orgName}</strong> pledged:
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {issue.analyzed && issue.aiAnalysis ? (
        <Analysis issue={issue} />
      ) : (
        <div className="await">
          <BrainCircuit />
          <div>
            <h3>Waiting for civic intelligence</h3>
            <p>
              Once an administrator analyzes this issue, its
              priority, solution idea and likely partners will
              appear here.
            </p>
          </div>
        </div>
      )}

      {err && <div className="error">{err}</div>}
    </section>
  );
}

function OrganizationDashboard({ user }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadChallenges = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/challenges");

      const allChallenges = response.data || [];

      const assigned = allChallenges.filter(
        (challenge) => challenge.my_assignment
      );

      setChallenges(assigned);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Could not load your challenges."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, [user.id]);

  const updateProgress = async (
    challengeId,
    status
  ) => {
    try {
      setBusy(`${challengeId}-${status}`);
      setError("");
      setSuccess("");

      await api.patch(
        `/challenges/${challengeId}/progress`,
        { status }
      );

      setSuccess(
        status === "Completed"
          ? "Challenge marked as completed."
          : `Challenge moved to ${status}.`
      );

      await loadChallenges();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Could not update challenge progress."
      );
    } finally {
      setBusy("");
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <section className="page organization-dashboard">
      <div className="detail-top">
        <div>
          <p className="eyebrow">
            {user.role === "university"
              ? "UNIVERSITY"
              : user.role === "industry"
                ? "INDUSTRY"
                : "NGO"}{" "}
            WORKSPACE
          </p>

          <h1>My Civic Challenges</h1>

          <p className="lead">
            View challenges assigned to your organization
            and keep their progress updated.
          </p>
        </div>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {success && (
        <div className="success">
          {success}
        </div>
      )}

      <div className="organization-stats">
        <div className="stat-card">
          <span>Assigned</span>

          <strong>
            {
              challenges.filter(
                (c) =>
                  c.my_assignment_status ===
                  "Assigned"
              ).length
            }
          </strong>
        </div>

        <div className="stat-card">
          <span>Accepted</span>

          <strong>
            {
              challenges.filter(
                (c) =>
                  c.my_assignment_status ===
                  "Accepted"
              ).length
            }
          </strong>
        </div>

        <div className="stat-card">
          <span>In Progress</span>

          <strong>
            {
              challenges.filter(
                (c) =>
                  c.my_assignment_status ===
                  "In Progress"
              ).length
            }
          </strong>
        </div>

        <div className="stat-card">
          <span>Completed</span>

          <strong>
            {
              challenges.filter(
                (c) =>
                  c.my_assignment_status ===
                  "Completed"
              ).length
            }
          </strong>
        </div>
      </div>

      <div className="organization-challenge-list">
        {challenges.map((challenge) => {
          const status =
            challenge.my_assignment_status ||
            "Assigned";

          const stages = [
            "Assigned",
            "Accepted",
            "In Progress",
            "Completed",
          ];

          const currentIndex =
            stages.indexOf(status);

          return (
            <div
              className="challenge-progress-card"
              key={challenge.id}
            >
              <div className="challenge-progress-header">
                <div>
                  <span className="challenge-domain">
                    {challenge.domain || "Civic Challenge"}
                  </span>

                  <h3>{challenge.title}</h3>
                </div>

                <span
                  className={`challenge-status ${(
                    challenge.my_assignment_status ||
                    "Assigned"
                  )
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    }`}
                >
                  {challenge.my_assignment_status || "Assigned"}
                </span>
              </div>

              <p>
                {challenge.problem_statement ||
                  challenge.description}
              </p>

              {challenge.expected_outcome && (
                <div className="challenge-detail">
                  <strong>Expected outcome</strong>

                  <p>
                    {challenge.expected_outcome}
                  </p>
                </div>
              )}

              <div className="challenge-progress">
                {[
                  "Assigned",
                  "Accepted",
                  "In Progress",
                  "Completed",
                ].map((stage, index) => {
                  const currentIndex = [
                    "Assigned",
                    "Accepted",
                    "In Progress",
                    "Completed",
                  ].indexOf(
                    challenge.my_assignment_status ||
                    "Assigned"
                  );

                  const isCompleted =
                    currentIndex >= index;

                  const isCurrent =
                    currentIndex === index;

                  return (
                    <React.Fragment key={stage}>
                      <div
                        className={`progress-stage ${isCompleted ? "completed" : ""
                          } ${isCurrent ? "current" : ""
                          }`}
                      >
                        <div className="progress-circle">
                          {isCompleted ? (
                            <CheckCircle2 size={17} />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>

                        <span>{stage}</span>
                      </div>

                      {index < 3 && (
                        <div
                          className={`progress-line ${currentIndex > index
                            ? "completed"
                            : ""
                            }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              <div className="organization-challenge-actions">

                {challenge.my_assignment_status ===
                  "Assigned" && (
                    <button
                      className="btn"
                      disabled={
                        busy ===
                        `${challenge.id}-Accepted`
                      }
                      onClick={() =>
                        updateProgress(
                          challenge.id,
                          "Accepted"
                        )
                      }
                    >
                      {busy ===
                        `${challenge.id}-Accepted`
                        ? "Accepting..."
                        : "Accept Challenge"}
                    </button>
                  )}

                {challenge.my_assignment_status ===
                  "Accepted" && (
                    <button
                      className="btn"
                      disabled={
                        busy ===
                        `${challenge.id}-In Progress`
                      }
                      onClick={() =>
                        updateProgress(
                          challenge.id,
                          "In Progress"
                        )
                      }
                    >
                      {busy ===
                        `${challenge.id}-In Progress`
                        ? "Starting..."
                        : "Start Work"}
                    </button>
                  )}

                {challenge.my_assignment_status ===
                  "In Progress" && (
                    <button
                      className="btn"
                      disabled={
                        busy ===
                        `${challenge.id}-Completed`
                      }
                      onClick={() =>
                        updateProgress(
                          challenge.id,
                          "Completed"
                        )
                      }
                    >
                      {busy ===
                        `${challenge.id}-Completed`
                        ? "Completing..."
                        : "Mark Completed"}
                    </button>
                  )}

                {challenge.my_assignment_status ===
                  "Completed" && (
                    <div className="success-badge">
                      <CheckCircle2 size={16} />
                      Challenge completed
                    </div>
                  )}

              </div>

              {challenge.my_assignment_status ===
                "Assigned" && (
                  <div className="progress-message">
                    <ArrowRight size={17} />

                    This challenge has been assigned
                    to your organization. Accept it to
                    begin working.
                  </div>
                )}

              {challenge.my_assignment_status ===
                "Accepted" && (
                  <div className="progress-message">
                    <CheckCircle2 size={17} />

                    You have accepted this challenge.
                    Start work when you are ready.
                  </div>
                )}

              {challenge.my_assignment_status ===
                "In Progress" && (
                  <div className="progress-message active-message">
                    <LoaderCircle size={17} />

                    Your organization is currently
                    working on this challenge.
                  </div>
                )}

              {challenge.my_assignment_status ===
                "Completed" && (
                  <div className="progress-message completed-message">
                    <CheckCircle2 size={17} />

                    Your organization has completed
                    this challenge.
                  </div>
                )}
            </div>
          );
        })}

        {!challenges.length && (
          <div className="empty">
            <Building2 size={28} />

            <h3>
              No challenges assigned yet
            </h3>

            <p>
              When an administrator assigns a
              civic challenge to your organization,
              it will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function AdminDashboard() {
  const [issues, setIssues] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [issuesResponse, challengesResponse] =
        await Promise.all([
          api.get("/issues"),
          api.get("/challenges"),
        ]);

      setIssues(issuesResponse.data || []);
      setChallenges(challengesResponse.data || []);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Could not load admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const generateChallenge = async (issueId) => {
    try {
      setBusy(`generate-${issueId}`);
      setError("");
      setSuccess("");

      await api.post(`/challenges/from-issue/${issueId}`);

      setSuccess("Challenge generated successfully.");

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Could not generate challenge."
      );
    } finally {
      setBusy("");
    }
  };

  const openChallenge = async (challengeId) => {
    try {
      setBusy(`open-${challengeId}`);
      setError("");

      const response = await api.get(
        `/challenges/${challengeId}`
      );

      setSelectedChallenge(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Could not load challenge details."
      );
    } finally {
      setBusy("");
    }
  };

  const assignOrganization = async (
    challengeId,
    organizationId
  ) => {
    if (!organizationId) {
      setError("Please select a university or industry.");
      return;
    }

    try {
      setBusy(`assign-${organizationId}`);
      setError("");
      setSuccess("");

      await api.post(
        `/challenges/${challengeId}/assign`,
        {
          organization_user_id: organizationId,
        }
      );

      setSuccess(
        "Challenge assigned successfully."
      );

      await openChallenge(challengeId);
      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Could not assign organization."
      );
    } finally {
      setBusy("");
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <section className="page">
      <div className="detail-top">
        <div>
          <p className="eyebrow">
            ADMIN CONTROL CENTER
          </p>

          <h1>Civic Challenge Management</h1>

          <p className="lead">
            Turn analyzed civic problems into practical
            challenges and connect them with organizations
            that can work on them.
          </p>
        </div>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {success && (
        <div className="success">
          {success}
        </div>
      )}

      <div className="admin-stats">
        <div className="stat-card">
          <span>Complaints</span>
          <strong>{issues.length}</strong>
        </div>

        <div className="stat-card">
          <span>Analyzed</span>
          <strong>
            {
              issues.filter(
                (i) => i.analyzed
              ).length
            }
          </strong>
        </div>

        <div className="stat-card">
          <span>Challenges</span>
          <strong>
            {challenges.length}
          </strong>
        </div>

        <div className="stat-card">
          <span>Active</span>
          <strong>
            {
              challenges.filter(
                (c) =>
                  c.status === "Open" ||
                  c.status === "In Progress"
              ).length
            }
          </strong>
        </div>
      </div>

      <section className="admin-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              STEP 1
            </p>

            <h2>
              Turn Problems Into Challenges
            </h2>
          </div>
        </div>

        <div className="admin-list">
          {issues
            .filter((issue) => issue.analyzed)
            .map((issue) => {
              const challenge =
                challenges.find(
                  (c) =>
                    c.issue_id === issue.id
                );

              return (
                <div
                  className="admin-card"
                  key={issue.id}
                >
                  <div className="admin-card-main">
                    <div className="issue-meta">
                      <span className="role">
                        {issue.submitter_role}
                      </span>

                      <span
                        className={`priority ${issue.priority?.toLowerCase()}`}
                      >
                        {issue.priority}
                      </span>
                    </div>

                    <h3>
                      {issue.title}
                    </h3>

                    <p>
                      {issue.description}
                    </p>

                    <span className="location">
                      <MapPin size={15} />

                      {issue.street},{" "}
                      {issue.city},{" "}
                      {issue.state}
                    </span>
                  </div>

                  <div className="admin-card-action">
                    {challenge ? (
                      <div className="success-badge">
                        <CheckCircle2
                          size={16}
                        />

                        Challenge generated
                      </div>
                    ) : (
                      <button
                        className="btn analyze"
                        disabled={
                          busy ===
                          `generate-${issue.id}`
                        }
                        onClick={() =>
                          generateChallenge(
                            issue.id
                          )
                        }
                      >
                        {busy ===
                          `generate-${issue.id}` ? (
                          <LoaderCircle
                            className="spin"
                            size={17}
                          />
                        ) : (
                          <Sparkles
                            size={17}
                          />
                        )}

                        {busy ===
                          `generate-${issue.id}`
                          ? "Generating..."
                          : "Generate Challenge"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {!issues.filter(
            (i) => i.analyzed
          ).length && <Empty />}
        </div>
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              STEP 2
            </p>

            <h2>
              Assign Challenges
            </h2>
          </div>
        </div>

        <div className="admin-list">
          {challenges.map(
            (challenge) => (
              <div
                className="admin-card challenge-card"
                key={challenge.id}
              >
                <div className="admin-card-main">
                  <div className="issue-meta">
                    <span className="role">
                      {challenge.domain ||
                        "Civic"}
                    </span>

                    <span className="pending">
                      {challenge.status}
                    </span>
                  </div>

                  <h3>
                    {challenge.title}
                  </h3>

                  <p>
                    {challenge.problem_statement ||
                      challenge.description}
                  </p>

                  {challenge.expected_outcome && (
                    <div className="challenge-detail">
                      <strong>
                        Expected outcome
                      </strong>

                      <p>
                        {
                          challenge.expected_outcome
                        }
                      </p>
                    </div>
                  )}

                  {Array.isArray(
                    challenge.required_expertise
                  ) &&
                    challenge
                      .required_expertise
                      .length > 0 && (
                      <div className="tag-list">
                        {challenge.required_expertise.map(
                          (
                            item,
                            index
                          ) => (
                            <span
                              key={
                                index
                              }
                            >
                              {item}
                            </span>
                          )
                        )}
                      </div>
                    )}

                  {selectedChallenge?.challenge
                    ?.id === challenge.id && (
                      <div className="assignment-panel">
                        <h4>
                          Recommended organizations
                        </h4>

                        {selectedChallenge.matches
                          ?.length ? (
                          <div className="organization-list">
                            {selectedChallenge.matches.map(
                              (match) => {
                                const organization =
                                  match.users;

                                if (
                                  !organization
                                )
                                  return null;

                                const details =
                                  organization.role ===
                                    "university"
                                    ? organization.university_details
                                    : organization.industry_details;

                                return (
                                  <div
                                    className="organization-row"
                                    key={
                                      match.id
                                    }
                                  >
                                    <div className="organization-info">
                                      <div className="partner-icon">
                                        {organization.role ===
                                          "university" ? (
                                          <Building2
                                            size={
                                              17
                                            }
                                          />
                                        ) : (
                                          <Users
                                            size={
                                              17
                                            }
                                          />
                                        )}
                                      </div>

                                      <div>
                                        <span className="role">
                                          {
                                            organization.role
                                          }
                                        </span>

                                        <h4>
                                          {
                                            organization.name
                                          }
                                        </h4>

                                        <p>
                                          {Array.isArray(
                                            match.matched_expertise
                                          )
                                            ? match.matched_expertise.join(
                                              ", "
                                            )
                                            : "Relevant civic capabilities"}
                                        </p>

                                        {details
                                          ?.city && (
                                            <small>
                                              {
                                                details.city
                                              }
                                              ,{" "}
                                              {
                                                details.state
                                              }
                                            </small>
                                          )}
                                      </div>
                                    </div>

                                    <div className="organization-action">
                                      {match.status ===
                                        "Assigned" ? (
                                        <span className="assigned-badge">
                                          <CheckCircle2
                                            size={
                                              15
                                            }
                                          />
                                          Assigned
                                        </span>
                                      ) : (
                                        <button
                                          className="btn small"
                                          disabled={
                                            busy ===
                                            `assign-${organization.id}`
                                          }
                                          onClick={() =>
                                            assignOrganization(
                                              challenge.id,
                                              organization.id
                                            )
                                          }
                                        >
                                          {busy ===
                                            `assign-${organization.id}` ? (
                                            <LoaderCircle
                                              className="spin"
                                              size={
                                                15
                                              }
                                            />
                                          ) : (
                                            <ArrowRight
                                              size={
                                                15
                                              }
                                            />
                                          )}

                                          Assign
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        ) : (
                          <p className="muted">
                            No matched organizations
                            found.
                          </p>
                        )}
                      </div>
                    )}
                </div>

                <div className="admin-card-action">
                  <button
                    className="btn secondary"
                    disabled={
                      busy ===
                      `open-${challenge.id}`
                    }
                    onClick={() =>
                      openChallenge(
                        challenge.id
                      )
                    }
                  >
                    {busy ===
                      `open-${challenge.id}` ? (
                      <LoaderCircle
                        className="spin"
                        size={16}
                      />
                    ) : (
                      <Users size={16} />
                    )}

                    {selectedChallenge?.challenge
                      ?.id === challenge.id
                      ? "Refresh Matches"
                      : "View Matches"}
                  </button>
                </div>
              </div>
            )
          )}

          {!challenges.length && (
            <Empty />
          )}
        </div>
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">STEP 3</p>

            <h2>Live Challenge Progress</h2>

            <p className="section-description">
              Track the progress of every organization working on
              each civic challenge.
            </p>
          </div>
        </div>

        <div className="challenge-progress-list">
          {challenges.map((challenge) => {
            const assignments =
              challenge.assignments?.length
                ? challenge.assignments
                : (challenge.matches || []).filter(
                  (match) => match.status !== "Rejected"
                );

            const stages = [
              "Assigned",
              "Accepted",
              "In Progress",
              "Completed",
            ];

            return (
              <div
                className="challenge-progress-card"
                key={challenge.id}
              >

                <div className="challenge-progress-header">
                  <div>
                    <span className="challenge-domain">
                      {challenge.domain || "Civic Challenge"}
                    </span>

                    <h3>{challenge.title}</h3>
                  </div>

                  <span
                    className={`challenge-status ${challenge.status
                      ?.toLowerCase()
                      .replace(/\s+/g, "-")
                      }`}
                  >
                    {challenge.status || "Open"}
                  </span>
                </div>


                {assignments.length === 0 ? (
                  <>
                    <div className="not-assigned">
                      <Users size={17} />

                      <span>
                        This challenge has not been assigned
                        to any organization yet.
                      </span>
                    </div>

                    <div className="progress-message">
                      <CircleAlert size={17} />

                      Assign this challenge to a university
                      or industry to start tracking progress.
                    </div>
                  </>
                ) : (
                  <div className="assigned-organizations-list">
                    {assignments.map((assignment) => {
                      const status =
                        assignment.status || "Assigned";

                      const currentIndex =
                        stages.indexOf(status);

                      const organization =
                        assignment.users || null;

                      const organizationName =
                        organization?.name ||
                        "Assigned organization";

                      return (
                        <div
                          className="assigned-organization-progress"
                          key={assignment.id}
                        >

                          <div className="assigned-organization">
                            {organization?.role ===
                              "industry" ? (
                              <Users size={17} />
                            ) : (
                              <Building2 size={17} />
                            )}

                            <div>
                              <span>Assigned to</span>

                              <strong>
                                {organizationName}
                              </strong>

                              {organization?.role && (
                                <small>
                                  {organization.role}
                                </small>
                              )}
                            </div>

                            <span
                              className={`challenge-status ${status
                                .toLowerCase()
                                .replace(/\s+/g, "-")
                                }`}
                            >
                              {status}
                            </span>
                          </div>

                          <div className="challenge-progress">
                            {stages.map(
                              (stage, index) => {
                                const isCompleted =
                                  currentIndex >= index;

                                const isCurrent =
                                  currentIndex === index;

                                return (
                                  <React.Fragment
                                    key={stage}
                                  >
                                    <div
                                      className={`progress-stage ${isCompleted
                                        ? "completed"
                                        : ""
                                        } ${isCurrent
                                          ? "current"
                                          : ""
                                        }`}
                                    >
                                      <div className="progress-circle">
                                        {isCompleted ? (
                                          <CheckCircle2
                                            size={17}
                                          />
                                        ) : (
                                          <span>
                                            {index + 1}
                                          </span>
                                        )}
                                      </div>

                                      <span>
                                        {stage}
                                      </span>
                                    </div>

                                    {index <
                                      stages.length -
                                      1 && (
                                        <div
                                          className={`progress-line ${currentIndex >
                                            index
                                            ? "completed"
                                            : ""
                                            }`}
                                        />
                                      )}
                                  </React.Fragment>
                                );
                              }
                            )}
                          </div>

                          {status === "Completed" && (
                            <div className="progress-message completed-message">
                              <CheckCircle2 size={17} />

                              Challenge completed successfully
                              by this organization.
                            </div>
                          )}

                          {status === "In Progress" && (
                            <div className="progress-message active-message">
                              <LoaderCircle size={17} />

                              Organization is currently working
                              on this challenge.
                            </div>
                          )}

                          {status === "Accepted" && (
                            <div className="progress-message">
                              <CheckCircle2 size={17} />

                              Organization has accepted the
                              challenge and is ready to begin work.
                            </div>
                          )}

                          {status === "Assigned" && (
                            <div className="progress-message">
                              <ArrowRight size={17} />

                              Challenge has been assigned and is
                              waiting for organization acceptance.
                            </div>
                          )}

                          {status === "Rejected" && (
                            <div className="progress-message rejected-message">
                              <CircleAlert size={17} />

                              This organization rejected the
                              challenge.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {!challenges.length && (
            <div className="empty">
              <h3>No challenges yet</h3>

              <p>
                Generate a challenge from an analyzed civic
                complaint to start tracking its progress.
              </p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

function Analysis({ issue }) {
  const analysis = issue.aiAnalysis;

  if (!analysis) {
    return (
      <div className="await">
        <BrainCircuit />
        <div>
          <h3>AI analysis is available</h3>
          <p>
            Refresh the page or analyze this issue again to view the
            complete civic analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="analysis">

      <div className="analysis-head">
        <div className="icon-box green">
          <BrainCircuit />
        </div>

        <div>
          <div className="eyebrow">AI civic brief</div>
          <h2>
            From signal to <em>next step.</em>
          </h2>
        </div>
      </div>

      <div className="analysis-grid">

        <div>
          <small>Domain</small>
          <strong>{analysis.domain || issue.domain || "Not identified"}</strong>
        </div>

        <div>
          <small>Priority</small>
          <strong>{issue.priority || "Medium"}</strong>
        </div>

        <div>
          <small>Urgency</small>
          <strong>{analysis.urgency || "Not identified"}</strong>
        </div>

        <div className="wide">
          <small>Actual problem</small>
          <p>{analysis.actual_problem}</p>
        </div>

        <div className="wide">
          <small>Required expertise</small>

          <div className="tags">
            {Array.isArray(analysis.required_expertise) &&
              analysis.required_expertise.map((x, index) => (
                <span key={index}>{x}</span>
              ))}
          </div>
        </div>

      </div>

      <div className="solution">
        <Sparkles size={19} />

        <div>
          <small>Root cause</small>

          <p>
            {analysis.root_cause || "No root cause identified."}
          </p>

          {analysis.root_cause_reasoning && (
            <>
              <small>Reasoning</small>
              <p>{analysis.root_cause_reasoning}</p>
            </>
          )}
        </div>
      </div>

      <div className="analysis-block">
        <h2>Impact</h2>

        {Array.isArray(analysis.impacts) ? (
          <ul>
            {analysis.impacts.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p>{analysis.impacts}</p>
        )}
      </div>

      <div className="analysis-block">
        <h2>Recommended actions</h2>

        {Array.isArray(analysis.recommended_actions) ? (
          <ol>
            {analysis.recommended_actions.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ol>
        ) : (
          <p>{analysis.recommended_actions}</p>
        )}
      </div>

      <div className="analysis-block">
        <h2>Preventive measures</h2>

        {Array.isArray(analysis.preventive_measures) ? (
          <ul>
            {analysis.preventive_measures.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p>{analysis.preventive_measures}</p>
        )}
      </div>

      <div className="analysis-block">
        <h2>Technology & data requirements</h2>

        {Array.isArray(analysis.technology_data_requirements) ? (
          <ul>
            {analysis.technology_data_requirements.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p>{analysis.technology_data_requirements}</p>
        )}
      </div>

      <div className="solution">
        <Sparkles size={19} />

        <div>
          <small>Suggested solution pathway</small>

          <p>
            {analysis.practical_solution ||
              "No practical solution was generated."}
          </p>
        </div>
      </div>

      <div className="analysis-block">
        <h2>AI confidence</h2>
        <p>{analysis.confidence || "Not specified"}</p>
      </div>

      {analysis.verification_required && (
        <div className="analysis-block">
          <h2>Verification required</h2>

          <p>
            {analysis.verification_notes ||
              "Some information should be verified on the ground."}
          </p>
        </div>
      )}

      {analysis.evidence_summary && (
        <div className="analysis-block">
          <h2>Historical evidence</h2>
          <p>
            {typeof analysis.evidence_summary === "string"
              ? analysis.evidence_summary
              : JSON.stringify(analysis.evidence_summary)}
          </p>
        </div>
      )}
      <div className="analysis-block organization-matches">

        <div className="organization-heading">
          <div>
            <div className="eyebrow">
              <Users size={15} /> Civic network
            </div>

            <h2>Recommended universities & industries</h2>

            <p>
              Organizations are matched using the expertise and civic
              domain identified by the AI analysis.
            </p>
          </div>

          <span className="match-count">
            {issue.matches?.length || 0}
          </span>
        </div>


        {issue.matches?.length > 0 ? (

          <div className="organization-list">

            {issue.matches.map((match) => {

              const organization = match.users || {};

              const role = organization.role;

              const details =
                role === "university"
                  ? organization.university_details || {}
                  : organization.industry_details || {};

              return (
                <div
                  className="organization-card"
                  key={match.id}
                >

                  <div className="organization-icon">

                    {role === "university" ? (
                      <Building2 size={22} />
                    ) : (
                      <Leaf size={22} />
                    )}

                  </div>

                  <div className="organization-info">

                    <div className="organization-top">

                      <span className="role">
                        {role === "university"
                          ? "University"
                          : "Industry"}
                      </span>

                      <strong className="match-score">
                        {match.match_score}% match
                      </strong>

                    </div>

                    <h3>
                      {organization.name}
                    </h3>

                    {(details.city || details.state) && (
                      <p className="organization-location">
                        <MapPin size={14} />

                        {details.city}
                        {details.city && details.state
                          ? ", "
                          : ""}
                        {details.state}
                      </p>
                    )}

                    {match.matched_expertise?.length > 0 && (
                      <div className="matched-capabilities">

                        <small>
                          Matched expertise
                        </small>

                        <div className="tags">

                          {match.matched_expertise.map(
                            (expertise, index) => (
                              <span key={index}>
                                {expertise}
                              </span>
                            )
                          )}

                        </div>

                      </div>
                    )}

                    {match.match_reason && (
                      <p className="match-reason">
                        {match.match_reason}
                      </p>
                    )}

                  </div>

                </div>
              );

            })}

          </div>

        ) : (

          <div className="empty">
            <Users />

            <p>
              No university or industry matches have been
              generated for this issue yet.
            </p>
          </div>

        )}

      </div>

    </section>
  );
}

function Loading() {
  return (
    <div className="loading">
      <LoaderCircle className="spin" /> Loading civic signals…
    </div>
  );
}

function Empty({ text = "No issues have been shared yet." }) {
  return (
    <div className="empty">
      <Leaf />
      <p>{text}</p>
    </div>
  );
}


createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);