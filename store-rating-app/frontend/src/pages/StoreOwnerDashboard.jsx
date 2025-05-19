import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { getToken } from "../utils/auth";

const StoreOwnerDashboard = () => {
  const [ratings, setRatings] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/store-owner/ratings", {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });
        setRatings(res.data.ratings);
        setAvgRating(res.data.averageRating);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load ratings");
      }
    };
    fetchRatings();
  }, []);

  return (
    <div>
      <Navbar />
      <div style={{ padding: 20 }}>
        <h2>Store Owner Dashboard</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}

        <h3>Average Rating: {avgRating.toFixed(2)}</h3>

        <h3>Ratings</h3>
        <table border="1" cellPadding="10" cellSpacing="0">
          <thead>
            <tr>
              <th>Rater Email</th>
              <th>Rating</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {ratings.length === 0 && (
              <tr>
                <td colSpan="3">No ratings found</td>
              </tr>
            )}
            {ratings.map((rating) => (
              <tr key={rating._id}>
                <td>{rating.raterEmail}</td>
                <td>{rating.rating}</td>
                <td>{rating.comment || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreOwnerDashboard;
