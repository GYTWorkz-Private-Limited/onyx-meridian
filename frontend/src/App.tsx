import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppProvider, useAppContext } from "@/context/AppContext";
import { ProtectedRoute } from "@/components/routing/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";

// Pages
import Dashboard from "@/pages/dashboard";
import DigitalTwin from "@/pages/digital-twin";
import BusinessUnits from "@/pages/business-units";
import BusinessUnitDetail from "@/pages/business-unit-detail";
import Intelligence from "@/pages/intelligence";
import Workforce from "@/pages/workforce";
import MissionControl from "@/pages/agentops";
import Governance from "@/pages/governance";
import Outcomes from "@/pages/outcomes";
import Tasks from "@/pages/tasks";
import Simulation from "@/pages/simulation";
import Approvals from "@/pages/approvals";

// Build pages
import AgentStudio from "@/pages/agent-studio";
import BusinessImpact from "@/pages/business-impact";
import DigitalEmployee from "@/pages/digital-employee";
import WorkflowStudio from "@/pages/workflow-studio";
import KnowledgeStudio from "@/pages/knowledge-studio";
import SopPage from "@/pages/sop";
import KpiStudio from "@/pages/kpi-studio";
import Documents from "@/pages/documents";
import PromptPlayground from "@/pages/prompt-playground";

import AgentLogsPage from "@/pages/agent-logs";
import MissionReplay from "@/pages/mission-replay";
import RecommendationDetail from "@/pages/recommendation-detail";
// Sub-pages
import PolicyStudio from "@/pages/policy-studio";
import WorkflowView from "@/pages/workflow-view";
import AnomalyDeepDive from "@/pages/anomaly-deep-dive";
import IncidentDetail from "@/pages/incident-detail";

// RBAC + capability-synthesis additions
import MyWork from "@/pages/my-work";
import EmployeeMetrics from "@/pages/employee-metrics";
import MyActivity from "@/pages/my-activity";
import UnitOfWork from "@/pages/unit-of-work";
import Adapters from "@/pages/adapters";
import Connectors from "@/pages/connectors";
import Goals from "@/pages/goals";
import Projects from "@/pages/projects";
import CostControl from "@/pages/cost-control";
import AbuOnboarding from "@/pages/abu-onboarding";
import People from "@/pages/people";
import WorkforceIntelligence from "@/pages/workforce-intelligence";

const queryClient = new QueryClient();

function HomeRoute() {
  const { role } = useAppContext();
  return role === "cxo" ? <DigitalTwin /> : <Redirect to="/my-work" />;
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={HomeRoute} />
        <ProtectedRoute path="/digital-twin" component={DigitalTwin} />
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <ProtectedRoute path="/business-units" component={BusinessUnits} />
        <ProtectedRoute path="/business-units/:id" component={BusinessUnitDetail} />
        <ProtectedRoute path="/business-impact" component={BusinessImpact} />
        <ProtectedRoute path="/intelligence" component={Intelligence} />
        <ProtectedRoute path="/workforce" component={Workforce} />
        <ProtectedRoute path="/agentops" component={MissionControl} />
        <ProtectedRoute path="/governance" component={Governance} />
        <Route path="/outcomes" component={Outcomes} />
        <Route path="/tasks" component={Tasks} />
        <ProtectedRoute path="/simulation" component={Simulation} />
        <ProtectedRoute path="/approvals" component={Approvals} />
        {/* Build */}
        <ProtectedRoute path="/agent-studio" component={AgentStudio} />
        <Route path="/agents/:id" component={DigitalEmployee} />
        <ProtectedRoute path="/workflow-studio" component={WorkflowStudio} />
        <ProtectedRoute path="/knowledge-studio" component={KnowledgeStudio} />
        <ProtectedRoute path="/sop" component={SopPage} />
        <ProtectedRoute path="/kpi-studio" component={KpiStudio} />
        <ProtectedRoute path="/documents" component={Documents} />
        <ProtectedRoute path="/prompt-playground" component={PromptPlayground} />
        {/* Sub-pages */}
        <ProtectedRoute path="/policy-studio" component={PolicyStudio} />
        <Route path="/workflow/:id" component={WorkflowView} />
        <Route path="/anomaly-deep-dive/:id" component={AnomalyDeepDive} />
        <Route path="/incident/:id" component={IncidentDetail} />
        <ProtectedRoute path="/agent-logs" component={AgentLogsPage} />
        <ProtectedRoute path="/mission-replay" component={MissionReplay} />
        <Route path="/intelligence/recommendation/:id" component={RecommendationDetail} />
        {/* RBAC + capability-synthesis additions */}
        <Route path="/my-work" component={MyWork} />
        <ProtectedRoute path="/employee-metrics" component={EmployeeMetrics} />
        <ProtectedRoute path="/my-activity" component={MyActivity} />
        <ProtectedRoute path="/unit-of-work" component={UnitOfWork} />
        <ProtectedRoute path="/adapters" component={Adapters} />
        <ProtectedRoute path="/connectors" component={Connectors} />
        <ProtectedRoute path="/goals" component={Goals} />
        <ProtectedRoute path="/projects" component={Projects} />
        <ProtectedRoute path="/cost-control" component={CostControl} />
        <ProtectedRoute path="/abu-onboarding" component={AbuOnboarding} />
        <ProtectedRoute path="/people" component={People} />
        <ProtectedRoute path="/workforce-intelligence" component={WorkforceIntelligence} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Gate() {
  const { isAuthenticated } = useAppContext();
  return isAuthenticated ? <Router /> : <Login />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Gate />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
