import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUserRole, logout } from "../utils/auth";

const Navbar = () => {
  const navigate = useNavigate();
  const role = getUserRole();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      style={{
        backgroundColor: "#222",
        color: "white",
        padding: "10px 20px",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <div>
        <Link to="/" style={{ color: "white", textDecoration: "none" }}>
          Store Rating App
        </Link>
      </div>
      <div>
        {role === "admin" && <Link to="/admin" style={linkStyle}>Admin Dashboard</Link>}
        {role === "storeowner" && <Link to="/store-owner" style={linkStyle}>Store Owner Dashboard</Link>}
        {role === "rater" && <Link to="/rater" style={linkStyle}>Rater Dashboard</Link>}
        <button onClick={handleLogout} style={buttonStyle}>
          Logout
        </button>
      </div>
    </nav>
  );
};

const linkStyle = {
  color: "white",
  marginRight: 15,
  textDecoration: "none",
};

const buttonStyle = {
  backgroundColor: "#ff4d4d",
  border: "none",
  padding: "6px 12px",
  cursor: "pointer",
  color: "white",
};

export default Navbar;
