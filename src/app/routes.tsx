import { createBrowserRouter } from "react-router";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { LocationForm } from "./pages/LocationForm";
import { LocationDetail } from "./pages/LocationDetail";
import { DevAdmin } from "./pages/DevAdmin";
import { Profile } from "./pages/Profile";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/dev-admin",
    Component: DevAdmin,
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
  },
  {
    path: "/profile",
    element: <ProtectedRoute><Profile /></ProtectedRoute>,
  },
  {
    path: "/locations/new",
    element: <ProtectedRoute><LocationForm /></ProtectedRoute>,
  },
  {
    path: "/locations/:id",
    element: <ProtectedRoute><LocationDetail /></ProtectedRoute>,
  },
  {
    path: "/locations/:id/edit",
    element: <ProtectedRoute><LocationForm /></ProtectedRoute>,
  },
]);