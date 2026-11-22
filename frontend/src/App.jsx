import "./App.css";

import {
  lazy,
  Suspense,
} from "react";
import {
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleRoute from "./components/RoleRoute.jsx";
import SiteFooter from "./components/SiteFooter.jsx";

const Home = lazy(
  () => import("./pages/Home.jsx"),
);

const Register = lazy(
  () => import("./pages/Register.jsx"),
);

const Login = lazy(
  () => import("./pages/Login.jsx"),
);

const VerifyEmail = lazy(
  () => import("./pages/VerifyEmail.jsx"),
);

const ForgotPassword = lazy(
  () => import("./pages/ForgotPassword.jsx"),
);

const Jobs = lazy(
  () => import("./pages/Jobs.jsx"),
);

const JobDetail = lazy(
  () => import("./pages/JobDetail.jsx"),
);

const Dashboard = lazy(
  () => import("./pages/Dashboard.jsx"),
);

const Applications = lazy(
  () => import("./pages/Applications.jsx"),
);

const Notifications = lazy(
  () => import("./pages/Notifications.jsx"),
);

const StudentProfile = lazy(
  () => import("./pages/StudentProfile.jsx"),
);

const SavedJobs = lazy(
  () => import("./pages/SavedJobs.jsx"),
);

const ApplyJob = lazy(
  () => import("./pages/ApplyJob.jsx"),
);

const StudentProgress = lazy(
  () => import("./pages/StudentProgress.jsx"),
);

const CompanyProfile = lazy(
  () => import("./pages/CompanyProfile.jsx"),
);

const CreateJob = lazy(
  () => import("./pages/CreateJob.jsx"),
);

const MyJobs = lazy(
  () => import("./pages/MyJobs.jsx"),
);

const EditJob = lazy(
  () => import("./pages/EditJob.jsx"),
);

const CompanyAnalytics = lazy(
  () => import("./pages/CompanyAnalytics.jsx"),
);

const NotFound = lazy(
  () => import("./pages/NotFound.jsx"),
);

function PageLoadingFallback() {
  return (
    <div
      className="route-loading"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <span
        className="route-loading-spinner"
        aria-hidden="true"
      />

      <p>Loading CareerBridge...</p>
    </div>
  );
}

function App() {
  return (
    <div className="app-shell">
      <div className="app-content">
        <Suspense
          fallback={<PageLoadingFallback />}
        >
          <Routes>
            {/* Public routes */}
            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/register"
              element={<Register />}
            />

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/verify-email"
              element={<VerifyEmail />}
            />

            <Route
              path="/forgot-password"
              element={<ForgotPassword />}
            />

            <Route
              path="/jobs"
              element={<Jobs />}
            />

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
                  <RoleRoute
                    allowedRoles={[
                      "student",
                    ]}
                  />
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
                  <RoleRoute
                    allowedRoles={[
                      "company",
                    ]}
                  />
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
                  element={
                    <CompanyAnalytics />
                  }
                />
              </Route>
            </Route>

            <Route
              path="*"
              element={<NotFound />}
            />
          </Routes>
        </Suspense>
      </div>

      <SiteFooter />
    </div>
  );
}

export default App;