import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); 
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(""); // เพิ่ม state error
  const navigate = useNavigate();

  const adminEmail = "admin@company.com";
  const adminPassword = "admin123"; // ตั้งรหัสผ่านจำลอง
  const userPassword = "user123";   // สำหรับผู้ใช้ทั่วไป

  const handleLogin = (e) => {
    e.preventDefault();

    if (email === adminEmail && password === adminPassword) {
      navigate("/admin");
    } else if (email !== adminEmail && password === userPassword) {
      navigate("/userhome");
    } else {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือไม่มีผู้ใช้นี้"); //แจ้งเตือน
    }
  };

  return (
    <div className="container-fluid login-wrapper">
      <div className="login-container p-4 rounded shadow-sm bg-white">
        <h1 className="text-center mb-4">Welcome to 360 Evaluation System</h1>
        
        {/* ⬇️ แสดง error message ถ้ามี */}
        {error && <div className="alert alert-danger text-center">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="mb-4 position-relative">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="password-toggle-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <button type="submit" className="btn btn-primary w-100">Login</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
