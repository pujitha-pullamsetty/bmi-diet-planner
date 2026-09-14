import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">

      <div className="footer-inner">

        <div>
          <div className="footer-brand">
            🥗 SmartDiet
          </div>

          <p>
            Smart nutrition. Better choices. Healthier living.
          </p>
        </div>

        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/rule-diet">Rule Diet</Link>
          <Link to="/results">My Plans</Link>
          <Link to="/smartbuddy">SmartBuddy</Link>
        </div>

      </div>

      <div className="copyright">
        © 2026 SmartDiet. All rights reserved.
      </div>

      <style>{`
        .footer {
          margin-top: 50px;
          padding: 35px 20px 18px;
          background: rgba(15,20,45,0.97);
          color: white;
        }

        .footer-inner {
          max-width: 1200px;
          margin: auto;

          display: flex;
          justify-content: space-between;
          gap: 30px;
          flex-wrap: wrap;
        }

        .footer-brand {
          font-size: 22px;
          font-weight: 900;
        }

        .footer p {
          opacity: 0.7;
        }

        .footer-links {
          display: flex;
          gap: 22px;
          align-items: center;
          flex-wrap: wrap;
        }

        .footer-links a {
          color: white;
          text-decoration: none;
          font-weight: 700;
        }

        .footer-links a:hover {
          color: #ff6875;
        }

        .copyright {
          max-width: 1200px;
          margin: 25px auto 0;
          padding-top: 15px;
          border-top: 1px solid rgba(255,255,255,0.12);
          text-align: center;
          opacity: 0.55;
          font-size: 13px;
        }
      `}</style>

    </footer>
  );
}