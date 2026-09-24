import "./App.css";
import SavedJobs from "./pages/SavedJobs.jsx";
import { Route, Routes } from "react-router-dom";
import Applications from "./pages/Applications.jsx";
import ApplyJob from "./pages/ApplyJob.jsx";
import CompanyProfile from "./pages/CompanyProfile.jsx";
import CreateJob from "./pages/CreateJob.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Home from "./pages/Home.jsx";
import JobDetail from "./pages/JobDetail.jsx";
import Jobs from "./pages/Jobs.jsx";
import Login from "./pages/Login.jsx";
import MyJobs from "./pages/MyJobs.jsx";
import Register from "./pages/Register.jsx";
import StudentProfile from "./pages/StudentProfile.jsx";
import EditJob from "./pages/EditJob.jsx";
import Notifications from "./pages/Notifications.jsx";
import CompanyAnalytics from "./pages/CompanyAnalytics.jsx";
import StudentProgress from "./pages/StudentProgress.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
<Route path="/saved-jobs" element={<SavedJobs />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={<Dashboard />} />

      <Route
        path="/profile"
        element={<StudentProfile />}
      />

      <Route
        path="/company-profile"
        element={<CompanyProfile />}
      />          

      <Route path="/jobs" element={<Jobs />} />

      <Route
        path="/jobs/new"
        element={<CreateJob />}
      />

      <Route
        path="/jobs/:id"
        element={<JobDetail />}
      />

      <Route
        path="/jobs/:id/apply"
        element={<ApplyJob />}
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
        path="/applications"
        element={<Applications />}
      />
      <Route
        path="/notifications"
        element={<Notifications />}
      />
      <Route
        path="/company-analytics"
        element={<CompanyAnalytics />}
      />
      <Route
        path="/student-progress"
        element={<StudentProgress />}
      />
      <Route
        path="/verify-email"
        element={<VerifyEmail />}
      />
    </Routes>   
    
  );
}

export default App;