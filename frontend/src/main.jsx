import Rewards from "./Rewards";
import { NotFound, ServerError } from './UXStates';
// Find your existing UXStates import and add SessionExpiredModal
import { NotFound, ServerError, SessionExpiredModal } from './UXStates';
import { PrivacyPolicy, TermsOfService, CommunityGuidelines } from "./Legal";
import { Bot } from 'lucide-react'; // Or swap for a custom emoji/image!
import CitizenMap from "./CitizenMap";
import AIChatWidget from './AIChatWidget';
import ARReporter from "./ARReporter";
import VRCommandCenter from "./VRCommandCenter";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
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
// THE FIX: Merged Moon and Sun into the main lucide-react import block!
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
  Menu,
  Plus,
  Sparkles,
  Users,
  X,
  Wrench,          
  ClipboardList,
  ThumbsUp,       
  HandHeart,
  Eye,
  Moon, 
  Sun 
} from "lucide-react";
import "./styles.css";
import Footer from "./Footer";

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

const api = axios.create({ baseURL: 'https://nagrik-nova.onrender.com/api' });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("nn-token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Broadcast a global event when the backend rejects the token
      window.dispatchEvent(new Event("session-expired"));
    }
    return Promise.reject(error);
  }
);
const useAuth = () => {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("nn-user") || "null"),
  );
  
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
  
  return { user, signIn, out };
};

// --- IMAGE UPLOAD HELPER ---
const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = () => resolve(fileReader.result);
    fileReader.onerror = (error) => reject(error);
  });
};

function App() {
  const auth = useAuth();
  const nav = useNavigate();
  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => {
    const handleExpired = () => {
      auth.out(); // Instantly clear the dead token from local storage
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
          <Route path="/issues" element={<Require user={auth.user}><Issues user={auth.user} /></Require>} />
          <Route path="/rewards" element={<Require user={auth.user}><Rewards user={auth.user} /></Require>} />
          <Route path="/map" element={<Require user={auth.user}><CitizenMap /></Require>} />
          <Route path="/issues/:id" element={<Require user={auth.user}><Detail user={auth.user} /></Require>} />
          <Route path="/dashboard" element={<Require user={auth.user}><Dashboard user={auth.user} /></Require>} />
          
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/guidelines" element={<CommunityGuidelines />} />
          
          <Route path="/500" element={<ServerError />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <AIChatWidget /> 
    </>
  );
}

function CursorCompanion() {
  const companionRef = React.useRef(null);

  React.useEffect(() => {
    const moveCompanion = (e) => {
      if (companionRef.current) {
        // translate3d forces hardware acceleration for zero-latency smoothness
        companionRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    window.addEventListener('mousemove', moveCompanion);
    return () => window.removeEventListener('mousemove', moveCompanion);
  }, []);

  return (
    <div ref={companionRef} className="cursor-companion">
      {/* THE FIX: Using the Nagrik Nova brand leaf! */}
      <Leaf size={18} strokeWidth={2.5} />
    </div>
  );
}
function Require({ user, children }) {
  return user ? children : <Navigate to="/login" replace />;
}

function Nav({ auth }) {
  const [open, setOpen] = useState(false);
  
  const closeMenu = () => setOpen(false);
  
  const [colorblind, setColorblind] = useState(() => 
    localStorage.getItem("nn-colorblind") === "true"
  );

  useEffect(() => {
    if (colorblind) {
      document.body.classList.add("colorblind-mode");
    } else {
      document.body.classList.remove("colorblind-mode");
    }
    localStorage.setItem("nn-colorblind", colorblind);
  }, [colorblind]);

  return (
    <header>
      <Link className="brand" to="/" onClick={closeMenu}>
        <span className="brand-mark">
          <Leaf size={20} />
        </span>
        <span>
          Nagrik <i>Nova</i>
        </span>
      </Link>
      <button className="menu" onClick={() => setOpen(!open)}>
        {open ? <X /> : <Menu />}
      </button>
      
      <nav className={open ? "show" : ""}>
        <NavLink to="/issues" onClick={closeMenu}>Explore issues</NavLink>
        <NavLink to="/map" onClick={closeMenu}>Live Map</NavLink>
        
        {auth.user && ["citizen", "ngo"].includes(auth.user.role) && (
          <>
            <NavLink to="/dashboard" onClick={closeMenu}>My dashboard</NavLink>
            <NavLink to="/rewards" onClick={closeMenu}>Rewards Store</NavLink>
          </>
        )}
        
        {auth.user && auth.user.role === "admin" && (
          <NavLink to="/vr-map" className="vr-link" onClick={closeMenu}>
            <Sparkles size={15} /> VR Command Center
          </NavLink>
        )}
        
        <button 
          className="text-btn" 
          onClick={() => {
            setColorblind(!colorblind);
            closeMenu();
          }} 
          title={colorblind ? "Disable Colorblind Mode" : "Enable Colorblind Mode"}
          style={{ display: "flex", alignItems: "center", gap: "5px" }}
        >
          <Eye size={18} /> {colorblind ? "Standard Mode" : "Accessible View"}
        </button>

        {/* THE FIX: Added the toggle switch directly into the navigation layout! */}
        <DarkModeToggle />

        {auth.user ? (
          <div className="nav-user" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <span className="user-dot">
              {auth.user.name.split(" ").map((x) => x[0]).slice(0, 2)}
            </span>
            <button className="text-btn" onClick={() => { auth.out(); closeMenu(); }}>
              Sign out
            </button>
          </div>
        ) : (
          <div className="nav-auth" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <Link to="/login" onClick={closeMenu}>Sign in</Link>
            <Link className="btn small" to="/register" onClick={closeMenu}>
              Join the network <ArrowRight size={15} />
            </Link>
          </div>
        )}
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
      auth.signIn((await api.post("/auth/login", data)).data);
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
    [d, setD] = useState({ 
      role: "citizen", 
      referredBy: new URLSearchParams(window.location.search).get('ref') || "" 
    }),
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
            value={d.phone || ""}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
        <Field
          label="Address"
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

function Field({ label, ...props }) {
  return (
    <label>
      {label}
      <input required {...props} />
    </label>
  );
}

function Issues({ user }) { 
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
        
        {user?.role !== "admin" && (
          <Link className="btn" to="/dashboard">
            <Plus size={17} /> Report an issue
          </Link>
        )}
        
      </div>
      {loading ? (
        <Loading />
      ) : (
        <div className="issue-grid">
          {items.map((i) => (
            <IssueCard key={i._id} issue={i} />
          ))}
        </div>
      )}
      {!loading && !items.length && <Empty />}
    </section>
  );
}

function IssueCard({ issue }) {
  return (
    <Link to={`/issues/${issue._id}`} className="issue" style={{ overflow: 'hidden', padding: 0 }}>
      {issue.imageUrl && (
        <img 
          src={issue.imageUrl} 
          alt="Issue" 
          style={{ width: '100%', height: '180px', objectFit: 'cover', borderBottom: '1px solid #e1e6df' }} 
        />
      )}
      <div style={{ padding: '21px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div className="issue-meta">
          <span className="role">{issue.submitterRole}</span>
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
        <div className="issue-bottom">
          <span>
            <MapPin size={15} />
            {issue.location}
          </span>
          <span className="arrow-circle">
            <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Dashboard({ user }) {
  const nav = useNavigate(),
    [issues, setIssues] = useState([]);
  
  const [data, setData] = useState({ title: "", description: "", state: "", city: "", location: "", imageUrl: "" });
  const [imagePreview, setImagePreview] = useState(null);
  
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [locationAttached, setLocationAttached] = useState(null); 
  
  const [isScanning, setIsScanning] = useState(false);

  // Detect if the user is on a mobile device (Android/iOS)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    api
      .get("/issues")
      .then((r) =>
        setIssues(
          r.data.filter(
            (i) =>
              i.submittedBy?._id === user.id || i.submittedBy === user.id,
          ),
        ),
      );
  }, [user.id]);

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

        // Wipe the old title and description so the Auto-Fill button comes back
        setData({ ...data, imageUrl: compressedBase64, title: "", description: "" });
        setImagePreview(compressedBase64);
      };
    };
  };

  const runAIVision = async (e) => {
    e.preventDefault();
    if (!imagePreview) return;
    
    setIsScanning(true);
    
    try {
      const response = await api.post("/vision", { imageBase64: imagePreview });
      
      setData({
        ...data,
        title: response.data.title,
        description: response.data.description
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
    try {
      const fullLocationString = data.city && data.state 
        ? `${data.location} • ${data.city}, ${data.state}` 
        : data.location;

      const r = await api.post("/issues", {
        ...data,
        location: fullLocationString,
        submittedBy: user._id || user.id,
        submitterRole: user.role
      });
      setIssues([r.data, ...issues]);
      
      setData({ title: "", description: "", state: "", city: "", location: "", imageUrl: "" });
      setImagePreview(null);
      setLocationAttached(null);
      setMsg("Your issue is now visible to the Nagrik Nova network.");
    } catch (e) {
      setErr(e.response?.data?.message || "Could not submit your report.");
    }
  };

  if (!["citizen", "ngo"].includes(user.role)) return <Navigate to="/issues" />;

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
            Your report can connect an everyday problem to the right problem-solvers.
          </p>
        </div>
      </div>
      <div className="dash-grid">
        <form className="report-form" onSubmit={post} style={{ alignSelf: "start", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2>Report a civic issue</h2>
          <p>
            Be specific. Your details help partners understand where action is needed.
          </p>
          
          <label>
            Attach a photo (Optional)
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', border: '1px dashed #ccc' }} 
            />
          </label>

          {isMobile && (
            <div style={{ padding: '18px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                <BrainCircuit size={18} /> Mobile AI Scanner
              </h4>
              <p style={{ fontSize: '12px', margin: '0 0 15px 0', color: 'var(--muted)', lineHeight: '1.5' }}>
                Skip typing. Snap a live photo of the issue and let Nova AI auto-fill the report details for you.
              </p>
              
              {/* THE FIX: Button correctly swaps text based on image preview! */}
              <label className="btn full" style={{ cursor: 'pointer', margin: 0, justifyContent: 'center' }}>
                <Sparkles size={16} /> {imagePreview ? "Take Photo Again" : "Open Camera"}
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleImageUpload} 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>
          )}
          
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

          {isMobile && imagePreview && !isScanning && !data.title && (
            <button 
              onClick={runAIVision} 
              type="button" 
              className="btn full" 
              style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981' }}
            >
              <Sparkles size={16} /> Auto-Fill using Nova AI
            </button>
          )}

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
            <label>
              State
              <input
                list="states-list"
                required
                placeholder="Type or select a state"
                value={data.state}
                onChange={(e) => setData({ ...data, state: e.target.value, city: "" })} 
              />
              <datalist id="states-list">
                {Object.keys(indiaData).map((st) => (
                  <option key={st} value={st} />
                ))}
              </datalist>
            </label>

            <label>
              City
              <input
                list="cities-list"
                required
                placeholder="Type or select a city"
                value={data.city}
                onChange={(e) => setData({ ...data, city: e.target.value })}
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
            value={data.location}
            onChange={(e) => setData({ ...data, location: e.target.value })}
          />

          <label>Capture exact spatial location (Optional)</label>
          <ARReporter 
            onLocationSaved={(coords) => {
              const finalLocation = coords.lat && coords.lng 
                ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` 
                : `AR Spatial: [${coords.x.toFixed(2)}, ${coords.z.toFixed(2)}]`;

              setData({ ...data, location: finalLocation });
              setLocationAttached(true); 
            }} 
          />

          {locationAttached && (
            <div style={{ textAlign: "center", color: "#4CAF50", fontWeight: "bold", padding: "12px", background: "rgba(76, 175, 80, 0.1)", borderRadius: "8px", margin: "10px 0 20px 0", border: "1px solid rgba(76, 175, 80, 0.3)" }}>
              ✅ High-Precision Location Data Attached!
            </div>
          )}

          {msg && <div className="success">{msg}</div>}
          {err && <div className="error">{err}</div>}
          <button className="btn full">
            Submit to the network <ArrowRight size={17} />
          </button>
        </form>

        <aside className="my-issues">
          <div className="issue" style={{ padding: '20px', marginBottom: '25px', display: 'flex', flexDirection: 'column', minHeight: 'auto' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
              <Sparkles size={18} color="#d97706" /> Earn 50 Coins!
            </h3>
            <p style={{ fontSize: '14px', marginBottom: '15px', lineHeight: '1.4' }}>
              Invite friends to Nagrik Nova. You get 50 coins for every successful sign-up!
            </p>
            <button 
              onClick={() => {
                const link = `${window.location.origin}/register?ref=${user.id || user._id}`;
                navigator.clipboard.writeText(link);
                alert("Referral link copied! Send it to your friends.");
              }} 
              className="btn small full" 
              style={{ background: 'rgba(217, 119, 6, 0.85)', justifyContent: 'center' }}
            >
              Copy Referral Link
            </button>
          </div>
          
          <h2>
            Your reports <span>{issues.length}</span>
          </h2>
          
          {issues.length ? (
            issues.map((i) => <IssueCard key={i._id} issue={i} />)
          ) : (
            <Empty text="Your submitted issues will appear here." />
          )}
        </aside>
      </div>
    </section>
  );
}

function Detail({ user }) {
  const nav = useNavigate();
  const { id } = useParams(),
    [issue, setIssue] = useState(null),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState("");

  const [upvotes, setUpvotes] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [pledges, setPledges] = useState([]);
  const [pledgeText, setPledgeText] = useState("");
  const [showPledgeForm, setShowPledgeForm] = useState(false);
  
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);

  const analysisRef = React.useRef(null);

  useEffect(() => {
    if (issue?.analyzed && analysisRef.current) {
      setTimeout(() => {
        analysisRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [issue?.analyzed]);

  useEffect(() => {
    api
      .get("/issues/" + id)
      .then((r) => setIssue(r.data))
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
    try {
      setIssue((await api.post(`/issues/${id}/analyze`)).data);
    } catch (e) {
      setErr(e.response?.data?.message || "Analysis could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  const flagIssue = async () => {
    if (!window.confirm("Are you sure you want to flag this issue? This will penalize the user.")) return;
    setIsFlagging(true);
    try {
      const r = await api.post(`/issues/${id}/flag`);
      setIssue(r.data);
    } catch (e) {
      alert("Failed to flag issue.");
    } finally {
      setIsFlagging(false);
    }
  };

  const deleteIssue = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this report? This cannot be undone.")) return;
    try {
      await api.delete(`/issues/${id}`);
      nav("/issues"); 
    } catch (e) {
      alert("Failed to delete issue.");
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const r = await api.delete(`/issues/${id}/comments/${commentId}`);
      setIssue(r.data); 
    } catch (e) {
      alert("Failed to delete comment.");
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

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      const r = await api.post(`/issues/${id}/comments`, {
        text: newComment,
        postedBy: user.name,
        role: user.role
      });
      setIssue(r.data); 
      setNewComment("");
    } catch (err) {
      alert("Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (err && !issue) return <section className="page"><div className="error">{err}</div></section>;
  if (!issue) return <Loading />;

  const canModifyIssue = user.role === 'admin' || user.id === issue.submittedBy || user._id === issue.submittedBy;

  return (
    <section className="page detail">
      <Link className="back" to="/issues">
        ← Back to issue board
      </Link>
      <div className="detail-top">
        <div>
          <div className="issue-meta">
            <span className="role">{issue.submitterRole}</span>
            {issue.analyzed ? (
              <span className={`priority ${issue.priority?.toLowerCase()}`}>
                {issue.priority} priority
              </span>
            ) : (
              <span className="pending">Awaiting analysis</span>
            )}
          </div>
          <h1>{issue.title}</h1>
          <p className="location">
            <MapPin size={17} />
            {issue.location} 
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap', width: '100%', justifyContent: 'space-between' }}>
          
          {user.role === "admin" && !issue.analyzed && (
            <button className="btn analyze" disabled={busy} onClick={analyze} style={{ flex: 1, padding: '12px 4px', whiteSpace: 'nowrap', fontSize: 'clamp(10px, 2.5vw, 13px)', minWidth: 0, justifyContent: 'center' }}>
              {busy ? (
                <LoaderCircle className="spin" size={15} />
              ) : (
                <BrainCircuit size={15} />
              )}
              <span style={{ marginLeft: '4px' }}>{busy ? "Analyzing..." : "Analyze"}</span>
            </button>
          )}

          {canModifyIssue && (
            <button className="btn" style={{ background: 'rgba(162, 61, 54, 0.85)', flex: 1, padding: '12px 4px', whiteSpace: 'nowrap', fontSize: 'clamp(10px, 2.5vw, 13px)', minWidth: 0, justifyContent: 'center' }} onClick={deleteIssue}>
              🗑️ <span style={{ marginLeft: '4px' }}>Delete</span>
            </button>
          )}

          {user.role === "admin" && (
            issue.isFlagged ? (
              <button className="btn" style={{ background: 'rgba(162, 61, 54, 0.5)', flex: 1, padding: '12px 4px', whiteSpace: 'nowrap', fontSize: 'clamp(10px, 2.5vw, 13px)', minWidth: 0, justifyContent: 'center' }} disabled>
                🚩 <span style={{ marginLeft: '4px' }}>Flagged</span>
              </button>
            ) : (
              <button className="btn" style={{ background: 'rgba(201, 81, 71, 0.85)', flex: 1, padding: '12px 4px', whiteSpace: 'nowrap', fontSize: 'clamp(10px, 2.5vw, 13px)', minWidth: 0, justifyContent: 'center' }} disabled={isFlagging} onClick={flagIssue}>
                {isFlagging ? "Flagging..." : "🚩 Flag"}
              </button>
            )
          )}

        </div>
        </div>

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

      {issue.imageUrl && (
        <div style={{ margin: '30px 0', borderRadius: '12px', overflow: 'hidden' }}>
          <img src={issue.imageUrl} alt="Issue evidence" style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }} />
        </div>
      )}

      {/* Community Comments Section */}
      <div className="community-impact" style={{ padding: '25px', marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>Community Discussion</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
          {issue.comments && issue.comments.length > 0 ? (
            issue.comments.map((c, i) => {
              const canDeleteComment = user.role === 'admin' || user.name === c.postedBy;
              
              return (
                <div key={i} style={{ padding: '15px', background: 'rgba(255,255,255,0.4)', borderRadius: '8px', borderLeft: '3px solid var(--green)', backdropFilter: 'blur(10px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px' }}>
                    <strong>{c.postedBy} <span style={{ color: '#888', fontWeight: 'normal' }}>({c.role})</span></strong>
                    
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ color: '#888' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                      
                      {canDeleteComment && (
                        <button 
                          onClick={() => deleteComment(c._id)} 
                          style={{ background: 'none', border: 'none', color: '#a23d36', cursor: 'pointer', fontSize: '14px', padding: 0 }}
                          title="Delete comment"
                        >
                          ✖
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>{c.text}</p>
                </div>
              );
            })
          ) : (
            <p style={{ color: '#888', fontStyle: 'italic', fontSize: '14px' }}>No comments yet. Start the conversation!</p>
          )}
        </div>

        <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Add a comment..." 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            style={{ flexGrow: 1 }}
          />
          <button type="submit" className="btn small" disabled={isSubmittingComment}>
            {isSubmittingComment ? "Posting..." : "Post"}
          </button>
        </form>
      </div>

      {issue.analyzed ? (
        <div ref={analysisRef} style={{ scrollMarginTop: '100px' }}>
          <Analysis issue={issue} />
        </div>
      ) : (
        <div className="await">
          <BrainCircuit />
          <div>
            <h3>Waiting for civic intelligence</h3>
            <p>
              Once an administrator analyzes this issue, its priority, solution
              idea and likely partners will appear here.
            </p>
          </div>
        </div>
      )}
      
      {err && <div className="error">{err}</div>}
    </section>
  );
}

function Analysis({ issue }) {
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
          <strong>{issue.domain}</strong>
        </div>
        <div>
          <small>Priority</small>
          <strong>{issue.priority}</strong>
        </div>
        <div className="wide">
          <small>Required expertise</small>
          <div className="tags">
            {issue.requiredExpertise?.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="solution">
        <Sparkles size={19} />
        <div>
          <small>Suggested solution pathway</small>
          <p>{issue.solutionIdea}</p>
        </div>
      </div>
      <h2 className="partners-title">
        Potential collaborators{" "}
        <span>{issue.matchedOrganizations?.length || 0}</span>
      </h2>
      <div className="partners">
        {issue.matchedOrganizations?.map((m) => (
          <div className="partner" key={m.userId}>
            <div className="partner-icon">
              {m.role === "university" ? <Building2 /> : <Leaf />}
            </div>
            <div>
              <span className="role">{m.role}</span>
              <h3>{m.name}</h3>
              <p>Aligned on {m.expertise.join(", ")}</p>
            </div>
          </div>
        )) || (
          <p>No registered organisation currently matches this expertise.</p>
        )}
      </div>
    </section>
  );
}

function IssueTracker({ issue }) {
  let currentStep = 1;
  if (issue.analyzed) currentStep = 2;
  if (issue.analyzed && issue.matchedOrganizations?.length > 0) currentStep = 3;
  if (issue.status === "in_progress") currentStep = 4; 
  if (issue.status === "resolved") currentStep = 5; 

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