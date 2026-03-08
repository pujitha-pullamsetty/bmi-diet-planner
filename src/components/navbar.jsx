import { Link, useLocation } from "react-router-dom";

export default function VNavbar() {
  const { pathname } = useLocation();
  const is = (p) => (pathname === p ? { background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.14)" } : null);

  return (
    <div className="vNav">
      <div className="vWrap vNavInner">
        <Link to="/" className="brand">
          <div className="brandDot"><span>🥗</span></div>
          <div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>BMI Diet</div>
            <div style={{ fontSize: 12, opacity: 0.65 }}>Vibrant UI</div>
          </div>
        </Link>

        <div className="navLinks">
          <Link className="navLink" style={is("/")} to="/">Home</Link>
          <Link className="navLink" style={is("/bmi")} to="/bmi">BMI</Link>
          <Link className="navLink" style={is("/rule-diet")} to="/rule-diet">Plans</Link>
          <Link className="navLink" style={is("/results")} to="/results">Results</Link>
          <Link className="navLink" style={is("/smartbuddy")} to="/smartbuddy">SmartBuddy</Link>
        </div>
      </div>
    </div>
  );
}
