import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem(
        "bmi_user",
        JSON.stringify(data.user)
      );
      localStorage.setItem(
        "nutrition_user_id",
        String(data.user.id)
      );

      // Return to the page the user originally wanted.
      const destination = location.state?.from || "/";

      navigate(destination, { replace: true });

    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-logo">
          🥗
        </div>

        <h1>Welcome Back</h1>

        <p className="subtitle">
          Login to continue your SmartDiet journey
        </p>

        <form onSubmit={handleLogin}>

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="bottom-text">
          Don't have an account?{" "}
          <Link to="/register">
            Create Account
          </Link>
        </p>

      </div>

      <style>{`
        .login-page {
          min-height: calc(100vh - 72px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          padding: 38px;

          background: rgba(255,255,255,0.95);
          border-radius: 24px;

          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
        }

        .login-logo {
          text-align: center;
          font-size: 55px;
        }

        .login-card h1 {
          text-align: center;
          margin: 8px 0;
          color: #202020;
          font-size: 30px;
        }

        .subtitle {
          text-align: center;
          color: #666;
          margin-bottom: 28px;
        }

        .login-card label {
          display: block;
          margin: 16px 0 7px;
          color: #333;
          font-weight: 800;
        }

        .login-card input {
          width: 100%;
          box-sizing: border-box;
          padding: 14px;

          border: 1px solid #ddd;
          border-radius: 11px;

          font-size: 15px;
          outline: none;
        }

        .login-card input:focus {
          border-color: #ff6875;
        }

        .login-card button {
          width: 100%;
          margin-top: 25px;
          padding: 14px;

          border: none;
          border-radius: 11px;

          background: #ff6875;
          color: white;

          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
        }

        .login-card button:hover {
          background: #ef3545;
        }

        .login-card button:disabled {
          opacity: 0.6;
        }

        .bottom-text {
          text-align: center;
          margin-top: 22px;
          color: #666;
        }

        .bottom-text a {
          color: #ef3545;
          font-weight: 800;
          text-decoration: none;
        }
      `}</style>

    </div>
  );
}