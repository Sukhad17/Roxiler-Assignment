import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { getToken } from "../utils/auth";

const RaterDashboard = () => {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [rating, setRating] = useState(1);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/stores", {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });
        setStores(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load stores");
      }
    };

    fetchStores();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await axios.post(
        "http://localhost:5000/api/ratings",
        {
          storeId: selectedStore,
          rating,
          comment,
        },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      setMessage("Rating submitted successfully");
      setSelectedStore("");
      setRating(1);
      setComment("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit rating");
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ padding: 20, maxWidth: 500, margin: "auto" }}>
        <h2>Rater Dashboard</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {message && <p style={{ color: "green" }}>{message}</p>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 10 }}>
            <label htmlFor="store-select">Select Store</label>
            <select
              id="store-select"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              required
              style={{ width: "100%", padding: 8 }}
            >
              <option value="">-- Select a store --</option>
              {stores.map((store) => (
                <option key={store._id} value={store._id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label htmlFor="rating-select">Rating</label>
            <select
              id="rating-select"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              required
              style={{ width: "100%", padding: 8 }}
            >
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label htmlFor="comment-textarea">Comment (optional)</label>
            <textarea
              id="comment-textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ width: "100%", padding: 8 }}
              rows={3}
            />
          </div>

          <button type="submit" style={{ padding: 10, width: "100%" }}>
            Submit Rating
          </button>
        </form>
      </div>
    </div>
  );
};

export default RaterDashboard;
