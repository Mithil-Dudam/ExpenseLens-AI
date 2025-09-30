import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "./AppContext";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUserId, setIsLoggedIn } = useAppContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("http://localhost:8000/login", { email, password });
      if (res.data.message === "Login successful") {
        setUserId(res.data.user_id);
        setIsLoggedIn(true);
        navigate("/home");
      } else {
        setError("Invalid email or password");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-900 rounded-2xl shadow-2xl border border-gray-800">
        <div className="flex flex-col items-center">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mb-4 text-blue-500">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3zm0 0c0-1.657-1.343-3-3-3s-3 1.343-3 3 1.343 3 3 3 3-1.343 3-3zm0 8v-4m0 0c-4.418 0-8-1.79-8-4V7a4 4 0 014-4h8a4 4 0 014 4v4c0 2.21-3.582 4-8 4z" />
          </svg>
          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Sign in to Expense Tracker</h2>
          <p className="text-gray-400 mb-6">Welcome back! Please enter your credentials.</p>
        </div>
        {error && <div className="text-red-400 text-center font-medium bg-gray-800 rounded py-2 px-4 mb-2">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 font-semibold text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>
        <div className="text-center mt-4">
          <span className="text-gray-400">Don't have an account?</span>{" "}
          <Link to="/register" className="text-blue-400 hover:underline font-medium">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;