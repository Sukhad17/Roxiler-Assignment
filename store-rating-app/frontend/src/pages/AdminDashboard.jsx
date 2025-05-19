import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { getToken } from "../utils/auth";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/users", {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });
        setUsers(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load users");
      }
    };
    fetchUsers();
  }, []);

  return (
    <div>
      <Navbar />
      <div style={{ padding: 20 }}>
        <h2>Admin Dashboard</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <h3>Users</h3>
        <table border="1" cellPadding="10" cellSpacing="0">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan="2">No users found</td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.email}</td>
                <td>{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
