import "./App.css";

import { Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleRoute from "./components/RoleRoute.jsx";

import Applications from "./pages/Applications.jsx";
import ApplyJob from "./pages/ApplyJob.jsx";
import CompanyAnalytics from "./pages/CompanyAnalytics.jsx";
import CompanyProfile from "./pages/CompanyProfile.jsx";
import CreateJob from "./pages/CreateJob.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import EditJob from "./pages/EditJob.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Home from "./pages/Home.jsx";
import JobDetail from "./pages/JobDetail.jsx";
import Jobs from "./pages/Jobs.jsx";
import Login from "./pages/Login.jsx";
import MyJobs from "./pages/MyJobs.jsx";
import Notifications from "./pages/Notifications.jsx";
import Register from "./pages/Register.jsx";
import SavedJobs from "./pages/SavedJobs.jsx";
import StudentProfile from "./pages/StudentProfile.jsx";
import StudentProgress from "./pages/StudentProgress.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/verify-email"
        element={<VerifyEmail />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route path="/jobs" element={<Jobs />} />

      <Route
        path="/jobs/:id"
        element={<JobDetail />}
      />

      {/* All authenticated users */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/applications"
          element={<Applications />}
        />

        <Route
          path="/notifications"
          element={<Notifications />}
        />

        {/* Student-only routes */}
        <Route
          element={
            <RoleRoute allowedRoles={["student"]} />
          }
        >
          <Route
            path="/profile"
            element={<StudentProfile />}
          />

          <Route
            path="/saved-jobs"
            element={<SavedJobs />}
          />

          <Route
            path="/jobs/:id/apply"
            element={<ApplyJob />}
          />

          <Route
            path="/student-progress"
            element={<StudentProgress />}
          />
        </Route>

        {/* Company-only routes */}
        <Route
          element={
            <RoleRoute allowedRoles={["company"]} />
          }
        >
          <Route
            path="/company-profile"
            element={<CompanyProfile />}
          />

          <Route
            path="/jobs/new"
            element={<CreateJob />}
          />

          <Route
            path="/my-jobs"
            element={<MyJobs />}
          />

          <Route
            path="/jobs/:id/edit"
            element={<EditJob />}
          />

          <Route
            path="/company-analytics"
            element={<CompanyAnalytics />}
          />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;