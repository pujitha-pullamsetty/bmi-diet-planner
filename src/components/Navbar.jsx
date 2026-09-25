import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("bmi_user") || "null");

  function logout() {
    localStorage.removeItem("bmi_user");
    navigate("/login");
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">

        <Link to="/" className="brand">
          🥗 <span>SmartDiet</span>
        </Link>

        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/rule-diet">Rule Diet</Link>
          <Link to="/results">My Plans</Link>
          <Link to="/smartbuddy">SmartBuddy</Link>
        </nav>

        <div className="nav-user">
          {user ? (
            <>
              <span className="welcome">
                Hi, {user.name}
              </span>

              <button onClick={logout} className="login-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="login-btn">
                Login
              </Link>

              <Link to="/register" className="register-btn">
                Register
              </Link>
            </>
          )}
        </div>

      </div>

      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 1000;
          width: 100%;
          background: rgba(15, 20, 45, 0.96);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.12);
        }

        .navbar-inner {
          max-width: 1200px;
          margin: auto;
          min-height: 72px;
          padding: 0 22px;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
        }

        .brand {
          color: white;
          text-decoration: none;
          font-size: 23px;
          font-weight: 900;
          white-space: nowrap;
        }

        .nav-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          flex: 1;
        }

        .nav-links a {
          color: rgba(255,255,255,0.9);
          text-decoration: none;
          font-weight: 700;
          transition: 0.2s;
        }

        .nav-links a:hover {
          color: #ff6875;
        }

        .nav-user {
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
        }

        .welcome {
          color: white;
          font-weight: 700;
        }

        .login-btn,
        .register-btn {
          padding: 9px 15px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 800;
          cursor: pointer;
          border: none;
        }

        .login-btn {
          background: rgba(255,255,255,0.12);
          color: white;
        }

        .register-btn {
          background: #ff6875;
          color: white;
        }

        .login-btn:hover {
          background: rgba(255,255,255,0.2);
        }

        .register-btn:hover {
          background: #ef3545;
        }

        @media (max-width: 850px) {
          .navbar-inner {
            flex-wrap: wrap;
            padding: 12px 16px;
          }

          .nav-links {
            order: 3;
            width: 100%;
            flex-basis: 100%;
            padding-bottom: 8px;
            gap: 14px;
          }
        }

        @media (max-width: 520px) {
          .nav-links {
            font-size: 13px;
            gap: 10px;
          }

          .welcome {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}