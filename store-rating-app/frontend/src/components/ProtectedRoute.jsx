import React from "react";
import { Navigate } from "react-router-dom";
import { getUserRole, isLoggedIn } from "../utils/auth";

const ProtectedRoute = ({ allowedRoles, children }) => {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  const role = getUserRole();
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
