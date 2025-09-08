import React from "react";
import "../myStyles/Dashboard.css";

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard-container">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p>
        Hoş geldiniz! Burada ziyaretçi istatistikleri yer alacak.
      </p>
    </div>
  );
};

export default Dashboard;
