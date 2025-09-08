import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Visitors from "./pages/Visitors";
import AddVisitor from "./pages/AddVisitor";
import VisitorDetail from "./pages/VisitorDetail";
import Logs from "./pages/Logs";
import EditVisitor from "./pages/EditVisitor";
import Stats from "./pages/Stats";
import VisitorLogsReport from "./pages/VisitorLogsReport";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Invitations from "./pages/Invitations";
import InvitationDetail from "./pages/InvitationDetail";
import Profile from "./pages/Profile";
import AddInvitation from "./pages/AddInvitation";

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Login sayfası ayrı, layout dışında */}
        <Route path="/login" element={<Login />} />

        {/* Korumalı alan: MainLayout + Outlet */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Default yönlendirme */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Layout içinde görünecek sayfalar */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/visitors" element={<Visitors />} />
          <Route path="/add-visitor" element={<AddVisitor />} />
          <Route path="/visitor/:id" element={<VisitorDetail />} />
          <Route path="/visitor/edit/:id" element={<EditVisitor />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/invitations" element={<Invitations />} />
          <Route path="/invitations/:slug" element={<InvitationDetail />} />
          <Route path="/add-invitation" element={<AddInvitation />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/reports/visitor-logs" element={<VisitorLogsReport />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
