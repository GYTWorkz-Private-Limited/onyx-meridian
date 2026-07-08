import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { Agent, AgentDetail, AgentRiskScore, AgentUpdate, AgentsSummary, Approval, AuditLog, BusinessResult, BusinessUnit, BusinessUnitDetail, DigitalTwin, Document, EnterpriseSummary, HealthStatus, Insight, IntelligenceEvent, Kpi, Opportunity, OutcomesMetrics, Policy, Risk, Task, TaskInput, TaskUpdate, Workflow } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetEnterpriseSummaryUrl: () => string;
/**
 * @summary Get enterprise-wide summary metrics
 */
export declare const getEnterpriseSummary: (options?: RequestInit) => Promise<EnterpriseSummary>;
export declare const getGetEnterpriseSummaryQueryKey: () => readonly ["/api/enterprise/summary"];
export declare const getGetEnterpriseSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getEnterpriseSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEnterpriseSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getEnterpriseSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetEnterpriseSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getEnterpriseSummary>>>;
export type GetEnterpriseSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Get enterprise-wide summary metrics
 */
export declare function useGetEnterpriseSummary<TData = Awaited<ReturnType<typeof getEnterpriseSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEnterpriseSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetEnterpriseRisksUrl: () => string;
/**
 * @summary Get top enterprise risks
 */
export declare const getEnterpriseRisks: (options?: RequestInit) => Promise<Risk[]>;
export declare const getGetEnterpriseRisksQueryKey: () => readonly ["/api/enterprise/risks"];
export declare const getGetEnterpriseRisksQueryOptions: <TData = Awaited<ReturnType<typeof getEnterpriseRisks>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEnterpriseRisks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getEnterpriseRisks>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetEnterpriseRisksQueryResult = NonNullable<Awaited<ReturnType<typeof getEnterpriseRisks>>>;
export type GetEnterpriseRisksQueryError = ErrorType<unknown>;
/**
 * @summary Get top enterprise risks
 */
export declare function useGetEnterpriseRisks<TData = Awaited<ReturnType<typeof getEnterpriseRisks>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEnterpriseRisks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetEnterpriseOpportunitiesUrl: () => string;
/**
 * @summary Get top enterprise opportunities
 */
export declare const getEnterpriseOpportunities: (options?: RequestInit) => Promise<Opportunity[]>;
export declare const getGetEnterpriseOpportunitiesQueryKey: () => readonly ["/api/enterprise/opportunities"];
export declare const getGetEnterpriseOpportunitiesQueryOptions: <TData = Awaited<ReturnType<typeof getEnterpriseOpportunities>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEnterpriseOpportunities>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getEnterpriseOpportunities>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetEnterpriseOpportunitiesQueryResult = NonNullable<Awaited<ReturnType<typeof getEnterpriseOpportunities>>>;
export type GetEnterpriseOpportunitiesQueryError = ErrorType<unknown>;
/**
 * @summary Get top enterprise opportunities
 */
export declare function useGetEnterpriseOpportunities<TData = Awaited<ReturnType<typeof getEnterpriseOpportunities>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEnterpriseOpportunities>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetIntelligenceFeedUrl: () => string;
/**
 * @summary Get enterprise intelligence feed events
 */
export declare const getIntelligenceFeed: (options?: RequestInit) => Promise<IntelligenceEvent[]>;
export declare const getGetIntelligenceFeedQueryKey: () => readonly ["/api/enterprise/intelligence-feed"];
export declare const getGetIntelligenceFeedQueryOptions: <TData = Awaited<ReturnType<typeof getIntelligenceFeed>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getIntelligenceFeed>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getIntelligenceFeed>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetIntelligenceFeedQueryResult = NonNullable<Awaited<ReturnType<typeof getIntelligenceFeed>>>;
export type GetIntelligenceFeedQueryError = ErrorType<unknown>;
/**
 * @summary Get enterprise intelligence feed events
 */
export declare function useGetIntelligenceFeed<TData = Awaited<ReturnType<typeof getIntelligenceFeed>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getIntelligenceFeed>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetDigitalTwinUrl: () => string;
/**
 * @summary Get enterprise digital twin state
 */
export declare const getDigitalTwin: (options?: RequestInit) => Promise<DigitalTwin>;
export declare const getGetDigitalTwinQueryKey: () => readonly ["/api/enterprise/digital-twin"];
export declare const getGetDigitalTwinQueryOptions: <TData = Awaited<ReturnType<typeof getDigitalTwin>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDigitalTwin>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDigitalTwin>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDigitalTwinQueryResult = NonNullable<Awaited<ReturnType<typeof getDigitalTwin>>>;
export type GetDigitalTwinQueryError = ErrorType<unknown>;
/**
 * @summary Get enterprise digital twin state
 */
export declare function useGetDigitalTwin<TData = Awaited<ReturnType<typeof getDigitalTwin>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDigitalTwin>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetBusinessUnitsUrl: () => string;
/**
 * @summary List all autonomous business units
 */
export declare const getBusinessUnits: (options?: RequestInit) => Promise<BusinessUnit[]>;
export declare const getGetBusinessUnitsQueryKey: () => readonly ["/api/business-units"];
export declare const getGetBusinessUnitsQueryOptions: <TData = Awaited<ReturnType<typeof getBusinessUnits>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBusinessUnits>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBusinessUnits>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBusinessUnitsQueryResult = NonNullable<Awaited<ReturnType<typeof getBusinessUnits>>>;
export type GetBusinessUnitsQueryError = ErrorType<unknown>;
/**
 * @summary List all autonomous business units
 */
export declare function useGetBusinessUnits<TData = Awaited<ReturnType<typeof getBusinessUnits>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBusinessUnits>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetBusinessUnitUrl: (id: string) => string;
/**
 * @summary Get a single business unit
 */
export declare const getBusinessUnit: (id: string, options?: RequestInit) => Promise<BusinessUnitDetail>;
export declare const getGetBusinessUnitQueryKey: (id: string) => readonly [`/api/business-units/${string}`];
export declare const getGetBusinessUnitQueryOptions: <TData = Awaited<ReturnType<typeof getBusinessUnit>>, TError = ErrorType<void>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBusinessUnit>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBusinessUnit>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBusinessUnitQueryResult = NonNullable<Awaited<ReturnType<typeof getBusinessUnit>>>;
export type GetBusinessUnitQueryError = ErrorType<void>;
/**
 * @summary Get a single business unit
 */
export declare function useGetBusinessUnit<TData = Awaited<ReturnType<typeof getBusinessUnit>>, TError = ErrorType<void>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBusinessUnit>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetBusinessUnitKpisUrl: (id: string) => string;
/**
 * @summary Get KPIs for a business unit
 */
export declare const getBusinessUnitKpis: (id: string, options?: RequestInit) => Promise<Kpi[]>;
export declare const getGetBusinessUnitKpisQueryKey: (id: string) => readonly [`/api/business-units/${string}/kpis`];
export declare const getGetBusinessUnitKpisQueryOptions: <TData = Awaited<ReturnType<typeof getBusinessUnitKpis>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBusinessUnitKpis>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBusinessUnitKpis>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBusinessUnitKpisQueryResult = NonNullable<Awaited<ReturnType<typeof getBusinessUnitKpis>>>;
export type GetBusinessUnitKpisQueryError = ErrorType<unknown>;
/**
 * @summary Get KPIs for a business unit
 */
export declare function useGetBusinessUnitKpis<TData = Awaited<ReturnType<typeof getBusinessUnitKpis>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBusinessUnitKpis>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetBusinessUnitWorkflowsUrl: (id: string) => string;
/**
 * @summary Get workflows for a business unit
 */
export declare const getBusinessUnitWorkflows: (id: string, options?: RequestInit) => Promise<Workflow[]>;
export declare const getGetBusinessUnitWorkflowsQueryKey: (id: string) => readonly [`/api/business-units/${string}/workflows`];
export declare const getGetBusinessUnitWorkflowsQueryOptions: <TData = Awaited<ReturnType<typeof getBusinessUnitWorkflows>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBusinessUnitWorkflows>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBusinessUnitWorkflows>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBusinessUnitWorkflowsQueryResult = NonNullable<Awaited<ReturnType<typeof getBusinessUnitWorkflows>>>;
export type GetBusinessUnitWorkflowsQueryError = ErrorType<unknown>;
/**
 * @summary Get workflows for a business unit
 */
export declare function useGetBusinessUnitWorkflows<TData = Awaited<ReturnType<typeof getBusinessUnitWorkflows>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBusinessUnitWorkflows>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetAgentsUrl: () => string;
/**
 * @summary List all AI employees
 */
export declare const getAgents: (options?: RequestInit) => Promise<Agent[]>;
export declare const getGetAgentsQueryKey: () => readonly ["/api/agents"];
export declare const getGetAgentsQueryOptions: <TData = Awaited<ReturnType<typeof getAgents>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAgents>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAgents>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAgentsQueryResult = NonNullable<Awaited<ReturnType<typeof getAgents>>>;
export type GetAgentsQueryError = ErrorType<unknown>;
/**
 * @summary List all AI employees
 */
export declare function useGetAgents<TData = Awaited<ReturnType<typeof getAgents>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAgents>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetAgentsSummaryUrl: () => string;
/**
 * @summary Get aggregated agent health and cost summary
 */
export declare const getAgentsSummary: (options?: RequestInit) => Promise<AgentsSummary>;
export declare const getGetAgentsSummaryQueryKey: () => readonly ["/api/agents/summary"];
export declare const getGetAgentsSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getAgentsSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAgentsSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAgentsSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAgentsSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getAgentsSummary>>>;
export type GetAgentsSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Get aggregated agent health and cost summary
 */
export declare function useGetAgentsSummary<TData = Awaited<ReturnType<typeof getAgentsSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAgentsSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetAgentUrl: (id: string) => string;
/**
 * @summary Get a single agent
 */
export declare const getAgent: (id: string, options?: RequestInit) => Promise<AgentDetail>;
export declare const getGetAgentQueryKey: (id: string) => readonly [`/api/agents/${string}`];
export declare const getGetAgentQueryOptions: <TData = Awaited<ReturnType<typeof getAgent>>, TError = ErrorType<void>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAgent>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAgent>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAgentQueryResult = NonNullable<Awaited<ReturnType<typeof getAgent>>>;
export type GetAgentQueryError = ErrorType<void>;
/**
 * @summary Get a single agent
 */
export declare function useGetAgent<TData = Awaited<ReturnType<typeof getAgent>>, TError = ErrorType<void>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAgent>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateAgentUrl: (id: string) => string;
/**
 * @summary Update agent status or config
 */
export declare const updateAgent: (id: string, agentUpdate: AgentUpdate, options?: RequestInit) => Promise<Agent>;
export declare const getUpdateAgentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAgent>>, TError, {
        id: string;
        data: BodyType<AgentUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateAgent>>, TError, {
    id: string;
    data: BodyType<AgentUpdate>;
}, TContext>;
export type UpdateAgentMutationResult = NonNullable<Awaited<ReturnType<typeof updateAgent>>>;
export type UpdateAgentMutationBody = BodyType<AgentUpdate>;
export type UpdateAgentMutationError = ErrorType<unknown>;
/**
* @summary Update agent status or config
*/
export declare const useUpdateAgent: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAgent>>, TError, {
        id: string;
        data: BodyType<AgentUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateAgent>>, TError, {
    id: string;
    data: BodyType<AgentUpdate>;
}, TContext>;
export declare const getGetTasksUrl: () => string;
/**
 * @summary List all tasks
 */
export declare const getTasks: (options?: RequestInit) => Promise<Task[]>;
export declare const getGetTasksQueryKey: () => readonly ["/api/tasks"];
export declare const getGetTasksQueryOptions: <TData = Awaited<ReturnType<typeof getTasks>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTasks>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTasksQueryResult = NonNullable<Awaited<ReturnType<typeof getTasks>>>;
export type GetTasksQueryError = ErrorType<unknown>;
/**
 * @summary List all tasks
 */
export declare function useGetTasks<TData = Awaited<ReturnType<typeof getTasks>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateTaskUrl: () => string;
/**
 * @summary Create a new task
 */
export declare const createTask: (taskInput: TaskInput, options?: RequestInit) => Promise<Task>;
export declare const getCreateTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTask>>, TError, {
        data: BodyType<TaskInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createTask>>, TError, {
    data: BodyType<TaskInput>;
}, TContext>;
export type CreateTaskMutationResult = NonNullable<Awaited<ReturnType<typeof createTask>>>;
export type CreateTaskMutationBody = BodyType<TaskInput>;
export type CreateTaskMutationError = ErrorType<unknown>;
/**
* @summary Create a new task
*/
export declare const useCreateTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTask>>, TError, {
        data: BodyType<TaskInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createTask>>, TError, {
    data: BodyType<TaskInput>;
}, TContext>;
export declare const getUpdateTaskUrl: (id: string) => string;
/**
 * @summary Update a task
 */
export declare const updateTask: (id: string, taskUpdate: TaskUpdate, options?: RequestInit) => Promise<Task>;
export declare const getUpdateTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTask>>, TError, {
        id: string;
        data: BodyType<TaskUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateTask>>, TError, {
    id: string;
    data: BodyType<TaskUpdate>;
}, TContext>;
export type UpdateTaskMutationResult = NonNullable<Awaited<ReturnType<typeof updateTask>>>;
export type UpdateTaskMutationBody = BodyType<TaskUpdate>;
export type UpdateTaskMutationError = ErrorType<unknown>;
/**
* @summary Update a task
*/
export declare const useUpdateTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTask>>, TError, {
        id: string;
        data: BodyType<TaskUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateTask>>, TError, {
    id: string;
    data: BodyType<TaskUpdate>;
}, TContext>;
export declare const getGetInsightsUrl: () => string;
/**
 * @summary Get AI intelligence insights and recommendations
 */
export declare const getInsights: (options?: RequestInit) => Promise<Insight[]>;
export declare const getGetInsightsQueryKey: () => readonly ["/api/intelligence/insights"];
export declare const getGetInsightsQueryOptions: <TData = Awaited<ReturnType<typeof getInsights>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getInsights>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getInsights>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetInsightsQueryResult = NonNullable<Awaited<ReturnType<typeof getInsights>>>;
export type GetInsightsQueryError = ErrorType<unknown>;
/**
 * @summary Get AI intelligence insights and recommendations
 */
export declare function useGetInsights<TData = Awaited<ReturnType<typeof getInsights>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getInsights>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetDocumentsUrl: () => string;
/**
 * @summary Get enterprise knowledge documents (Pulse)
 */
export declare const getDocuments: (options?: RequestInit) => Promise<Document[]>;
export declare const getGetDocumentsQueryKey: () => readonly ["/api/intelligence/documents"];
export declare const getGetDocumentsQueryOptions: <TData = Awaited<ReturnType<typeof getDocuments>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDocuments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDocuments>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDocumentsQueryResult = NonNullable<Awaited<ReturnType<typeof getDocuments>>>;
export type GetDocumentsQueryError = ErrorType<unknown>;
/**
 * @summary Get enterprise knowledge documents (Pulse)
 */
export declare function useGetDocuments<TData = Awaited<ReturnType<typeof getDocuments>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDocuments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetExecutionWorkflowsUrl: () => string;
/**
 * @summary Get execution workflow status (Flow)
 */
export declare const getExecutionWorkflows: (options?: RequestInit) => Promise<Workflow[]>;
export declare const getGetExecutionWorkflowsQueryKey: () => readonly ["/api/intelligence/workflows"];
export declare const getGetExecutionWorkflowsQueryOptions: <TData = Awaited<ReturnType<typeof getExecutionWorkflows>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getExecutionWorkflows>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getExecutionWorkflows>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetExecutionWorkflowsQueryResult = NonNullable<Awaited<ReturnType<typeof getExecutionWorkflows>>>;
export type GetExecutionWorkflowsQueryError = ErrorType<unknown>;
/**
 * @summary Get execution workflow status (Flow)
 */
export declare function useGetExecutionWorkflows<TData = Awaited<ReturnType<typeof getExecutionWorkflows>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getExecutionWorkflows>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetAuditLogsUrl: () => string;
/**
 * @summary Get governance audit trail
 */
export declare const getAuditLogs: (options?: RequestInit) => Promise<AuditLog[]>;
export declare const getGetAuditLogsQueryKey: () => readonly ["/api/governance/audit-logs"];
export declare const getGetAuditLogsQueryOptions: <TData = Awaited<ReturnType<typeof getAuditLogs>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAuditLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAuditLogs>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAuditLogsQueryResult = NonNullable<Awaited<ReturnType<typeof getAuditLogs>>>;
export type GetAuditLogsQueryError = ErrorType<unknown>;
/**
 * @summary Get governance audit trail
 */
export declare function useGetAuditLogs<TData = Awaited<ReturnType<typeof getAuditLogs>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAuditLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetPoliciesUrl: () => string;
/**
 * @summary Get governance policies
 */
export declare const getPolicies: (options?: RequestInit) => Promise<Policy[]>;
export declare const getGetPoliciesQueryKey: () => readonly ["/api/governance/policies"];
export declare const getGetPoliciesQueryOptions: <TData = Awaited<ReturnType<typeof getPolicies>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPolicies>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPolicies>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPoliciesQueryResult = NonNullable<Awaited<ReturnType<typeof getPolicies>>>;
export type GetPoliciesQueryError = ErrorType<unknown>;
/**
 * @summary Get governance policies
 */
export declare function useGetPolicies<TData = Awaited<ReturnType<typeof getPolicies>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPolicies>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetApprovalsUrl: () => string;
/**
 * @summary Get pending approval requests
 */
export declare const getApprovals: (options?: RequestInit) => Promise<Approval[]>;
export declare const getGetApprovalsQueryKey: () => readonly ["/api/governance/approvals"];
export declare const getGetApprovalsQueryOptions: <TData = Awaited<ReturnType<typeof getApprovals>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getApprovals>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getApprovals>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetApprovalsQueryResult = NonNullable<Awaited<ReturnType<typeof getApprovals>>>;
export type GetApprovalsQueryError = ErrorType<unknown>;
/**
 * @summary Get pending approval requests
 */
export declare function useGetApprovals<TData = Awaited<ReturnType<typeof getApprovals>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getApprovals>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetGovernanceRiskScoresUrl: () => string;
/**
 * @summary Get agent risk scores and violations
 */
export declare const getGovernanceRiskScores: (options?: RequestInit) => Promise<AgentRiskScore[]>;
export declare const getGetGovernanceRiskScoresQueryKey: () => readonly ["/api/governance/risk-scores"];
export declare const getGetGovernanceRiskScoresQueryOptions: <TData = Awaited<ReturnType<typeof getGovernanceRiskScores>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getGovernanceRiskScores>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getGovernanceRiskScores>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetGovernanceRiskScoresQueryResult = NonNullable<Awaited<ReturnType<typeof getGovernanceRiskScores>>>;
export type GetGovernanceRiskScoresQueryError = ErrorType<unknown>;
/**
 * @summary Get agent risk scores and violations
 */
export declare function useGetGovernanceRiskScores<TData = Awaited<ReturnType<typeof getGovernanceRiskScores>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getGovernanceRiskScores>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetOutcomesMetricsUrl: () => string;
/**
 * @summary Get EEI trend and efficiency metrics
 */
export declare const getOutcomesMetrics: (options?: RequestInit) => Promise<OutcomesMetrics>;
export declare const getGetOutcomesMetricsQueryKey: () => readonly ["/api/outcomes/metrics"];
export declare const getGetOutcomesMetricsQueryOptions: <TData = Awaited<ReturnType<typeof getOutcomesMetrics>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOutcomesMetrics>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getOutcomesMetrics>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetOutcomesMetricsQueryResult = NonNullable<Awaited<ReturnType<typeof getOutcomesMetrics>>>;
export type GetOutcomesMetricsQueryError = ErrorType<unknown>;
/**
 * @summary Get EEI trend and efficiency metrics
 */
export declare function useGetOutcomesMetrics<TData = Awaited<ReturnType<typeof getOutcomesMetrics>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOutcomesMetrics>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetBusinessResultsUrl: () => string;
/**
 * @summary Get business outcome results (productivity, cost, SLA, ROI)
 */
export declare const getBusinessResults: (options?: RequestInit) => Promise<BusinessResult[]>;
export declare const getGetBusinessResultsQueryKey: () => readonly ["/api/outcomes/business-results"];
export declare const getGetBusinessResultsQueryOptions: <TData = Awaited<ReturnType<typeof getBusinessResults>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBusinessResults>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBusinessResults>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBusinessResultsQueryResult = NonNullable<Awaited<ReturnType<typeof getBusinessResults>>>;
export type GetBusinessResultsQueryError = ErrorType<unknown>;
/**
 * @summary Get business outcome results (productivity, cost, SLA, ROI)
 */
export declare function useGetBusinessResults<TData = Awaited<ReturnType<typeof getBusinessResults>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBusinessResults>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map