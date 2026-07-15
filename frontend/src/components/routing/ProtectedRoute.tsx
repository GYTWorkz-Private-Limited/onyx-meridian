import { Redirect, Route } from "wouter";
import { useAppContext } from "@/context/AppContext";
import { canAccess, landingRouteFor } from "@/lib/rbac";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
}

// Wraps a wouter <Route>: if the current role can't access this path even
// via direct URL entry, redirect to that role's landing page instead of
// rendering the target component.
export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { role } = useAppContext();
  return (
    <Route path={path}>
      {canAccess(role, path) ? <Component /> : <Redirect to={landingRouteFor(role)} />}
    </Route>
  );
}
