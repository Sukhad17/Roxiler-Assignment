import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import StoreOwnerDashboard from "./pages/StoreOwnerDashboard";
import RaterDashboard from "./pages/RaterDashboard";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/store-owner"
        element={
          <ProtectedRoute allowedRoles={["storeowner"]}>
            <StoreOwnerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rater"
        element={
          <ProtectedRoute allowedRoles={["rater"]}>
            <RaterDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<h1>404 Not Found</h1>} />
    </Routes>
  );
}

export default App;
