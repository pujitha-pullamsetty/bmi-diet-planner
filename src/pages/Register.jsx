import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();

    if (!name || !email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Registration failed"
        );
      }

      alert("Account created successfully! 🎉");

      navigate("/login");

    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">

      <div className="register-card">

        <div className="register-logo">
          🥗
        </div>

        <h1>Create Account</h1>

        <p className="subtitle">
          Start your personalized SmartDiet journey
        </p>

        <form onSubmit={handleRegister}>

          <label>Name</label>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

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
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>

        </form>

        <p className="bottom-text">
          Already have an account?{" "}
          <Link to="/login">
            Login
          </Link>
        </p>

      </div>

      <style>{`
        .register-page {
          min-height: calc(100vh - 72px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .register-card {
          width: 100%;
          max-width: 420px;
          padding: 38px;

          background: rgba(255,255,255,0.95);
          border-radius: 24px;

          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
        }

        .register-logo {
          text-align: center;
          font-size: 55px;
        }

        .register-card h1 {
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

        .register-card label {
          display: block;
          margin: 16px 0 7px;
          color: #333;
          font-weight: 800;
        }

        .register-card input {
          width: 100%;
          box-sizing: border-box;
          padding: 14px;

          border: 1px solid #ddd;
          border-radius: 11px;

          font-size: 15px;
          outline: none;
        }

        .register-card input:focus {
          border-color: #ff6875;
        }

        .register-card button {
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

        .register-card button:hover {
          background: #ef3545;
        }

        .register-card button:disabled {
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