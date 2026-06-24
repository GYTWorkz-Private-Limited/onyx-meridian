# System Actions — RBAC Catalog

An exhaustive catalogue of the actions that can be performed on the Onyx Meridian
platform, with the role that may perform each. It is derived from the shipped API
surface (`meridian/routes/*`), the feature model
([enterprise-ai-features.md](enterprise-ai-features.md)), the onboarding/discovery
design ([business-onboarding-and-process-decomposition.md](business-onboarding-and-process-decomposition.md)),
the connector spine ([CONNECTORS.md](CONNECTORS.md)), and the platform plan
([PLATFORM-PLAN.md](PLATFORM-PLAN.md) — Vault, Ensure, Prism, Flow, Pulse).

The granularity is **near-API**: each row corresponds to roughly one endpoint or
one tight CRUD cluster, so the table translates directly into route + permission
scaffolding, but stays above raw field-level operations.

## Personas


| Persona                      | Scope                  | Summary                                                                                                                                                                                                                               |
| ---------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Department Member** (`DM`) | own self / own records | A human in a department. Interacts with AI employees: asks them, answers their questions, works the tasks they assign.                                                                                                                |
| **Department Head** (`DH`)   | **one** department     | Everything a member can, plus: onboards AI employees, builds units of work & workflows, manages connections + knowledge graph, controls cost, and onboards human members (up to member role) — all scoped to their single department. |
| **Admin** (`AD`)             | org-wide               | Everything, across all departments: onboards departments and department heads, sees the org-wide digital twin, owns global governance, policy, connectors and platform settings.                                                      |


> The **AI Employee** is a system actor, not a login role. Actions it performs at
> runtime are listed in module 7 and tagged *(AI-executed)*; the role columns there
> show which human **configures / authorizes** that capability.

## Legend


| Mark | Meaning                                               |
| ---- | ----------------------------------------------------- |
| ✅    | Permitted (org-wide / full)                           |
| 🔶   | Permitted, **scoped** to own department / own records |
| —    | Not permitted                                         |


---


| ID       | Module                   | Action                                      | Description                                          | DM  | DH  | AD  |
| -------- | ------------------------ | ------------------------------------------- | ---------------------------------------------------- | --- | --- | --- |
| AUTH-01  | Auth & Profile           | Log in                                      | Authenticate into the platform                       | ✅   | ✅   | ✅   |
| AUTH-02  | Auth & Profile           | Log out                                     | End the current session                              | ✅   | ✅   | ✅   |
| AUTH-03  | Auth & Profile           | Complete MFA challenge                      | Second-factor verification                           | ✅   | ✅   | ✅   |
| AUTH-04  | Auth & Profile           | Reset own password                          | Self-service password reset                          | ✅   | ✅   | ✅   |
| AUTH-05  | Auth & Profile           | View own profile                            | See own account details                              | ✅   | ✅   | ✅   |
| AUTH-06  | Auth & Profile           | Edit own profile                            | Update name, avatar, contact                         | ✅   | ✅   | ✅   |
| AUTH-07  | Auth & Profile           | View own sessions                           | List active sessions/devices                         | ✅   | ✅   | ✅   |
| AUTH-08  | Auth & Profile           | Revoke own session                          | Sign out a device                                    | ✅   | ✅   | ✅   |
| AUTH-09  | Auth & Profile           | Set notification preferences                | Choose channels & cadence                            | ✅   | ✅   | ✅   |
| AUTH-10  | Auth & Profile           | Switch department context                   | Change active department view                        | —   | —   | ✅   |
| AUTH-11  | Auth & Profile           | Create personal API token                   | Issue a scoped personal token                        | —   | 🔶  | ✅   |
| AUTH-12  | Auth & Profile           | Revoke any user's session                   | Force sign-out (security)                            | —   | —   | ✅   |
| AUTH-13  | Auth & Profile           | Impersonate user (support)                  | Assume a user for support                            | —   | —   | ✅   |
| AUTH-14  | Auth & Profile           | View login/audit of own account             | Own access history                                   | ✅   | ✅   | ✅   |
| DEPT-01  | Departments              | Onboard a department                        | Create a new business unit                           | —   | —   | ✅   |
| DEPT-02  | Departments              | Run department discovery                    | Kick off the onboarding agent for a dept             | —   | —   | ✅   |
| DEPT-03  | Departments              | Activate a department                       | Move onboarding → active                             | —   | —   | ✅   |
| DEPT-04  | Departments              | Pause a department                          | Suspend a department's operations                    | —   | —   | ✅   |
| DEPT-05  | Departments              | Archive a department                        | Retire a department                                  | —   | —   | ✅   |
| DEPT-06  | Departments              | List all departments                        | View org-wide department list                        | —   | —   | ✅   |
| DEPT-07  | Departments              | View own department                         | See own department detail                            | 🔶  | 🔶  | ✅   |
| DEPT-08  | Departments              | Edit department profile                     | Name, description, metadata                          | —   | 🔶  | ✅   |
| DEPT-09  | Departments              | Set department budget                       | Monthly USD budget cap                               | —   | 🔶  | ✅   |
| DEPT-10  | Departments              | Set allowed scopes (delegatable)            | Catalog of grantable data/action scopes              | —   | —   | ✅   |
| DEPT-11  | Departments              | Assign department caretaker                 | Accountable human for the dept                       | —   | —   | ✅   |
| DEPT-12  | Departments              | Configure deploy-approval requirement       | Require approval before deploys                      | —   | 🔶  | ✅   |
| DEPT-13  | Departments              | Configure decommission-approval requirement | Require approval before retire                       | —   | 🔶  | ✅   |
| DEPT-14  | Departments              | View department dashboard                   | Liveness, spend, headcount roll-up                   | 🔶  | 🔶  | ✅   |
| DEPT-15  | Departments              | View department business units              | List sub-units under a department                    | 🔶  | 🔶  | ✅   |
| DEPT-16  | Departments              | Create business unit under department       | Add a sub-unit (e.g. AR, AP)                         | —   | 🔶  | ✅   |
| DEPT-17  | Departments              | Edit business unit                          | Update a sub-unit                                    | —   | 🔶  | ✅   |
| DEPT-18  | Departments              | Map department hierarchy                    | Define parent/child unit links                       | —   | 🔶  | ✅   |
| DEPT-19  | Departments              | Re-run discovery (diff mode)                | Re-derive operating model as a diff                  | —   | 🔶  | ✅   |
| DEPT-20  | Departments              | Export department configuration             | Download dept spec/config                            | —   | 🔶  | ✅   |
| TWIN-01  | Org Twin & Canvas        | View org-wide digital twin                  | Whole-organization graph                             | —   | —   | ✅   |
| TWIN-02  | Org Twin & Canvas        | View org chart (canvas)                     | Interactive org/department chart                     | —   | —   | ✅   |
| TWIN-03  | Org Twin & Canvas        | View own department twin                    | Department-scoped digital twin                       | 🔶  | 🔶  | ✅   |
| TWIN-04  | Org Twin & Canvas        | View department canvas layout               | Canvas of units + employees                          | 🔶  | 🔶  | ✅   |
| TWIN-05  | Org Twin & Canvas        | Edit canvas layout                          | Arrange nodes on the canvas                          | —   | 🔶  | ✅   |
| TWIN-06  | Org Twin & Canvas        | Drill into employee node                    | Open a digital employee from the graph               | 🔶  | 🔶  | ✅   |
| TWIN-07  | Org Twin & Canvas        | Drill into unit node                        | Open a business unit from the graph                  | 🔶  | 🔶  | ✅   |
| TWIN-08  | Org Twin & Canvas        | View cross-department links                 | Inter-department relationships                       | —   | —   | ✅   |
| TWIN-09  | Org Twin & Canvas        | View reporting hierarchy                    | reports_to / super-agent tree                        | 🔶  | 🔶  | ✅   |
| TWIN-10  | Org Twin & Canvas        | Filter twin by status/tier                  | Focus the twin view                                  | 🔶  | 🔶  | ✅   |
| TWIN-11  | Org Twin & Canvas        | Export org/department graph                 | Download graph image/data                            | —   | 🔶  | ✅   |
| TWIN-12  | Org Twin & Canvas        | Snapshot twin at a point in time            | Save a versioned twin view                           | —   | 🔶  | ✅   |
| TWIN-13  | Org Twin & Canvas        | Compare twin snapshots                      | Diff two points in time                              | —   | 🔶  | ✅   |
| TWIN-14  | Org Twin & Canvas        | View live activity overlay                  | Real-time actions on the canvas                      | 🔶  | 🔶  | ✅   |
| USER-01  | People Management        | Onboard a department head                   | Create a human head & assign role                    | —   | —   | ✅   |
| USER-02  | People Management        | Onboard a department member                 | Add a human member to a department                   | —   | 🔶  | ✅   |
| USER-03  | People Management        | Invite user by email                        | Send a platform invitation                           | —   | 🔶  | ✅   |
| USER-04  | People Management        | Assign role to user                         | Grant member/head/admin role                         | —   | —   | ✅   |
| USER-05  | People Management        | Assign member role (own dept)               | Grant up-to-member role only                         | —   | 🔶  | ✅   |
| USER-06  | People Management        | Move user between departments               | Re-home a human user                                 | —   | —   | ✅   |
| USER-07  | People Management        | Edit user details                           | Update a human user record                           | —   | 🔶  | ✅   |
| USER-08  | People Management        | Deactivate a user                           | Disable a human account                              | —   | 🔶  | ✅   |
| USER-09  | People Management        | Reactivate a user                           | Re-enable a human account                            | —   | 🔶  | ✅   |
| USER-10  | People Management        | Reset another user's password               | Admin/head password reset                            | —   | 🔶  | ✅   |
| USER-11  | People Management        | List department members                     | View humans in own dept                              | 🔶  | 🔶  | ✅   |
| USER-12  | People Management        | List all users                              | Org-wide user directory                              | —   | —   | ✅   |
| USER-13  | People Management        | View a user profile                         | Open another human's profile                         | 🔶  | 🔶  | ✅   |
| USER-14  | People Management        | Set user as workflow gatekeeper             | Make a human accountable for a gate                  | —   | 🔶  | ✅   |
| USER-15  | People Management        | Set user's domain-expertise tags            | For knowledge-miss routing                           | —   | 🔶  | ✅   |
| USER-16  | People Management        | Register a Person (org-graph node)          | Create a person entity                               | —   | 🔶  | ✅   |
| USER-17  | People Management        | View Person record                          | Open a person entity                                 | 🔶  | 🔶  | ✅   |
| USER-18  | People Management        | Link Person ↔ AI employee                   | Caretaker/owner relationship                         | —   | 🔶  | ✅   |
| USER-19  | People Management        | Set user capacity / availability            | Working hours, leave                                 | 🔶  | 🔶  | ✅   |
| USER-20  | People Management        | Deactivate another admin                    | Manage admin accounts                                | —   | —   | ✅   |
| USER-21  | People Management        | View user activity/audit                    | A human's action history                             | —   | 🔶  | ✅   |
| USER-22  | People Management        | Bulk import users                           | CSV/SSO provisioning                                 | —   | —   | ✅   |
| ROLE-01  | Roles & Archetypes       | View archetype library                      | Browse reusable job templates                        | —   | 🔶  | ✅   |
| ROLE-02  | Roles & Archetypes       | View archetype detail                       | Open one archetype spec                              | —   | 🔶  | ✅   |
| ROLE-03  | Roles & Archetypes       | Create archetype                            | New reusable role template                           | —   | 🔶  | ✅   |
| ROLE-04  | Roles & Archetypes       | Edit archetype                              | Update template defaults                             | —   | 🔶  | ✅   |
| ROLE-05  | Roles & Archetypes       | Publish archetype to library                | Make available org-wide                              | —   | —   | ✅   |
| ROLE-06  | Roles & Archetypes       | Deprecate archetype                         | Retire a template                                    | —   | 🔶  | ✅   |
| ROLE-07  | Roles & Archetypes       | Set default capabilities                    | Template capability list                             | —   | 🔶  | ✅   |
| ROLE-08  | Roles & Archetypes       | Set default data scopes                     | Template data-scope defaults                         | —   | 🔶  | ✅   |
| ROLE-09  | Roles & Archetypes       | Set default action scopes                   | Template action-scope defaults                       | —   | 🔶  | ✅   |
| ROLE-10  | Roles & Archetypes       | Set default KPIs                            | Template KPI list                                    | —   | 🔶  | ✅   |
| ROLE-11  | Roles & Archetypes       | Set default tier                            | T1–T4 capability tier                                | —   | 🔶  | ✅   |
| ROLE-12  | Roles & Archetypes       | Set default adapter                         | Default runtime adapter/config                       | —   | 🔶  | ✅   |
| ROLE-13  | Roles & Archetypes       | Define role responsibilities                | Charter & responsibility list                        | —   | 🔶  | ✅   |
| ROLE-14  | Roles & Archetypes       | Clone an archetype                          | Duplicate as a starting point                        | —   | 🔶  | ✅   |
| ROLE-15  | Roles & Archetypes       | Instantiate employee from archetype         | Seed a new employee from template                    | —   | 🔶  | ✅   |
| ROLE-16  | Roles & Archetypes       | Compare archetype versions                  | Diff template revisions                              | —   | 🔶  | ✅   |
| EMP-01   | AI Employee — Lifecycle  | Instantiate AI employee                     | Create a draft employee                              | —   | 🔶  | ✅   |
| EMP-02   | AI Employee — Lifecycle  | View employee                               | Open one employee                                    | 🔶  | 🔶  | ✅   |
| EMP-03   | AI Employee — Lifecycle  | List employees                              | List employees (own dept)                            | 🔶  | 🔶  | ✅   |
| EMP-04   | AI Employee — Lifecycle  | Configure role & responsibilities           | Set charter/responsibilities/KPIs                    | —   | 🔶  | ✅   |
| EMP-05   | AI Employee — Lifecycle  | Configure capabilities                      | Set capability list                                  | —   | 🔶  | ✅   |
| EMP-06   | AI Employee — Lifecycle  | Configure permissions (scopes)              | Data/action scopes + deny (least-priv)               | —   | 🔶  | ✅   |
| EMP-07   | AI Employee — Lifecycle  | Configure budget                            | Monthly USD + rate caps                              | —   | 🔶  | ✅   |
| EMP-08   | AI Employee — Lifecycle  | Configure model policy                      | Preferred/allowed models                             | —   | 🔶  | ✅   |
| EMP-09   | AI Employee — Lifecycle  | Configure supervision                       | Caretaker + escalate-after hrs                       | —   | 🔶  | ✅   |
| EMP-10   | AI Employee — Lifecycle  | Configure adapter                           | Runtime adapter type/config                          | —   | 🔶  | ✅   |
| EMP-11   | AI Employee — Lifecycle  | Set capability tier                         | T1–T4                                                | —   | 🔶  | ✅   |
| EMP-12   | AI Employee — Lifecycle  | Set reports-to / owner                      | Org-graph placement                                  | —   | 🔶  | ✅   |
| EMP-13   | AI Employee — Lifecycle  | Set context bindings                        | Knowledge/context attachments                        | —   | 🔶  | ✅   |
| EMP-14   | AI Employee — Lifecycle  | Deploy employee                             | Attach to unit, issue credential, start in Shadow    | —   | 🔶  | ✅   |
| EMP-15   | AI Employee — Lifecycle  | Suspend employee                            | Pause an employee                                    | —   | 🔶  | ✅   |
| EMP-16   | AI Employee — Lifecycle  | Resume employee                             | Un-pause an employee                                 | —   | 🔶  | ✅   |
| EMP-17   | AI Employee — Lifecycle  | Promote autonomy (one rung)                 | shadow→assist→supervised→autonomous (Ensure-gated)   | —   | 🔶  | ✅   |
| EMP-18   | AI Employee — Lifecycle  | Demote autonomy (one rung)                  | Step down on drift                                   | —   | 🔶  | ✅   |
| EMP-19   | AI Employee — Lifecycle  | Set per-task autonomy                       | Autonomy level per workflow/task                     | —   | 🔶  | ✅   |
| EMP-20   | AI Employee — Lifecycle  | Decommission employee                       | Retire (cascade: revoke, reassign, retire schedules) | —   | 🔶  | ✅   |
| EMP-21   | AI Employee — Lifecycle  | View employee credential                    | Inspect issued principal                             | —   | 🔶  | ✅   |
| EMP-22   | AI Employee — Lifecycle  | Rotate employee credential                  | Re-issue scoped credential                           | —   | 🔶  | ✅   |
| EMP-23   | AI Employee — Lifecycle  | Set WIP limit (max parallel tasks)          | Concurrency cap                                      | —   | 🔶  | ✅   |
| EMP-24   | AI Employee — Lifecycle  | Set prioritization weights                  | Urgency/importance/readiness triad                   | —   | 🔶  | ✅   |
| EMP-25   | AI Employee — Lifecycle  | Bind workflow to employee                   | Attach a workflow it is responsible for              | —   | 🔶  | ✅   |
| EMP-26   | AI Employee — Lifecycle  | Unbind workflow from employee               | Detach a workflow                                    | —   | 🔶  | ✅   |
| EMP-27   | AI Employee — Lifecycle  | Tag bound workflow proactive/reactive       | Mark how the employee uses it                        | —   | 🔶  | ✅   |
| EMP-28   | AI Employee — Lifecycle  | Propose schedule (assisted)                 | Let employee suggest cadences                        | —   | 🔶  | ✅   |
| EMP-29   | AI Employee — Lifecycle  | Accept proposed schedule                    | Approve employee's cadence                           | —   | 🔶  | ✅   |
| EMP-30   | AI Employee — Lifecycle  | Pre-configure auto-schedule                 | Skip per-run acceptance gate                         | —   | 🔶  | ✅   |
| EMP-31   | AI Employee — Lifecycle  | Reassign in-flight work                     | Move tasks to a peer on decommission                 | —   | 🔶  | ✅   |
| EMP-32   | AI Employee — Lifecycle  | View employee spend                         | Spent vs budget                                      | 🔶  | 🔶  | ✅   |
| EMP-33   | AI Employee — Lifecycle  | View employee heartbeat                     | Last-alive / liveness                                | 🔶  | 🔶  | ✅   |
| EMP-34   | AI Employee — Lifecycle  | View employee version history               | Config revisions                                     | —   | 🔶  | ✅   |
| EMP-35   | AI Employee — Lifecycle  | View employee audit trail                   | Lifecycle audit rows                                 | —   | 🔶  | ✅   |
| EMP-36   | AI Employee — Lifecycle  | Set effectiveness formula (per employee)    | Custom effectiveness calculator                      | —   | 🔶  | ✅   |
| EMP-37   | AI Employee — Lifecycle  | Clone an employee                           | Duplicate config as a new draft                      | —   | 🔶  | ✅   |
| EMP-38   | AI Employee — Lifecycle  | Enable AI employee login (workspace)        | Let the employee sign in to its workspace            | —   | 🔶  | ✅   |
| RUN-01   | AI Employee — Runtime    | Trigger an employee run                     | Manually start a run *(AI-executed)*                 | —   | 🔶  | ✅   |
| RUN-02   | AI Employee — Runtime    | View employee runs                          | List/inspect runs                                    | 🔶  | 🔶  | ✅   |
| RUN-03   | AI Employee — Runtime    | Cancel a running run                        | Stop an in-flight run                                | —   | 🔶  | ✅   |
| RUN-04   | AI Employee — Runtime    | Heartbeat tick ("anything to do now?")      | Self-check loop *(AI-executed)*                      | —   | 🔶  | ✅   |
| RUN-05   | AI Employee — Runtime    | Fetch tasks from taskboard                  | Pull assigned work *(AI-executed)*                   | —   | 🔶  | ✅   |
| RUN-06   | AI Employee — Runtime    | Pick next task (prioritize)                 | Triad-based selection *(AI-executed)*                | —   | 🔶  | ✅   |
| RUN-07   | AI Employee — Runtime    | Wait / hold on a task                       | Defer when blocked/at WIP *(AI-executed)*            | —   | 🔶  | ✅   |
| RUN-08   | AI Employee — Runtime    | Run proactive workflow                      | Scheduled self-initiated work *(AI-executed)*        | —   | 🔶  | ✅   |
| RUN-09   | AI Employee — Runtime    | Run reactive workflow                       | Triggered by a human question *(AI-executed)*        | 🔶  | 🔶  | ✅   |
| RUN-10   | AI Employee — Runtime    | Query knowledge graph (tool)                | Read dept knowledge *(AI-executed)*                  | —   | 🔶  | ✅   |
| RUN-11   | AI Employee — Runtime    | Pull via connector (tool)                   | Read external data *(AI-executed)*                   | —   | 🔶  | ✅   |
| RUN-12   | AI Employee — Runtime    | Push via connector (tool)                   | Write external data *(AI-executed)*                  | —   | 🔶  | ✅   |
| RUN-13   | AI Employee — Runtime    | Reach out to a person (in-app chat tool)    | Ask a human a clarifying question *(AI-executed)*    | —   | 🔶  | ✅   |
| RUN-14   | AI Employee — Runtime    | Assign a task to a human                    | Delegate work to a real employee *(AI-executed)*     | —   | 🔶  | ✅   |
| RUN-15   | AI Employee — Runtime    | Answer a human's question                   | Respond from context *(AI-executed)*                 | —   | 🔶  | ✅   |
| RUN-16   | AI Employee — Runtime    | Raise a HITL proposal at a gate             | Propose an action for human commit *(AI-executed)*   | —   | 🔶  | ✅   |
| RUN-17   | AI Employee — Runtime    | Emit a knowledge-miss expert task           | Route unanswerable Qs to an expert *(AI-executed)*   | —   | 🔶  | ✅   |
| RUN-18   | AI Employee — Runtime    | Update taskboard status                     | Maintain its own board *(AI-executed)*               | —   | 🔶  | ✅   |
| RUN-19   | AI Employee — Runtime    | Self-report cost/effectiveness              | Emit metering events *(AI-executed)*                 | —   | 🔶  | ✅   |
| RUN-20   | AI Employee — Runtime    | Auto-suspend at budget cap                  | Stop on budget breach *(system)*                     | —   | 🔶  | ✅   |
| RUN-21   | AI Employee — Runtime    | Replay/resume a failed run                  | Idempotent re-run                                    | —   | 🔶  | ✅   |
| RUN-22   | AI Employee — Runtime    | View run cost trace                         | Per-step cost breakdown                              | 🔶  | 🔶  | ✅   |
| TASK-01  | Units of Work / Tasks    | Create task (commitment)                    | New unit of work                                     | —   | 🔶  | ✅   |
| TASK-02  | Units of Work / Tasks    | View task                                   | Open a task                                          | 🔶  | 🔶  | ✅   |
| TASK-03  | Units of Work / Tasks    | List tasks                                  | Browse/filter tasks                                  | 🔶  | 🔶  | ✅   |
| TASK-04  | Units of Work / Tasks    | View my assigned tasks                      | Tasks owned by me                                    | 🔶  | 🔶  | ✅   |
| TASK-05  | Units of Work / Tasks    | View tasks AI assigned to me                | Work delegated by an AI employee                     | 🔶  | 🔶  | ✅   |
| TASK-06  | Units of Work / Tasks    | View taskboard                              | Shared kanban board                                  | 🔶  | 🔶  | ✅   |
| TASK-07  | Units of Work / Tasks    | Edit task                                   | Title/description/metadata                           | 🔶  | 🔶  | ✅   |
| TASK-08  | Units of Work / Tasks    | Start task                                  | Mark in-progress                                     | 🔶  | 🔶  | ✅   |
| TASK-09  | Units of Work / Tasks    | Block task                                  | Mark blocked w/ reason                               | 🔶  | 🔶  | ✅   |
| TASK-10  | Units of Work / Tasks    | Complete task                               | Mark done                                            | 🔶  | 🔶  | ✅   |
| TASK-11  | Units of Work / Tasks    | Cancel task                                 | Cancel a commitment                                  | 🔶  | 🔶  | ✅   |
| TASK-12  | Units of Work / Tasks    | Reassign task                               | Change owner (person/AI)                             | —   | 🔶  | ✅   |
| TASK-13  | Units of Work / Tasks    | Set task priority                           | critical/high/medium/low                             | —   | 🔶  | ✅   |
| TASK-14  | Units of Work / Tasks    | Set due date                                | Deadline                                             | —   | 🔶  | ✅   |
| TASK-15  | Units of Work / Tasks    | Add task dependency                         | depends_on edge                                      | —   | 🔶  | ✅   |
| TASK-16  | Units of Work / Tasks    | Remove task dependency                      | Drop a dependency                                    | —   | 🔶  | ✅   |
| TASK-17  | Units of Work / Tasks    | Set escalation policy                       | none/notify/reassign                                 | —   | 🔶  | ✅   |
| TASK-18  | Units of Work / Tasks    | Comment on task                             | Add a note/comment                                   | 🔶  | 🔶  | ✅   |
| TASK-19  | Units of Work / Tasks    | View task provenance                        | Source meeting/email/doc + quote                     | 🔶  | 🔶  | ✅   |
| TASK-20  | Units of Work / Tasks    | View task audit ref                         | Link to immutable ledger                             | 🔶  | 🔶  | ✅   |
| TASK-21  | Units of Work / Tasks    | Link task to project                        | Attach to a project                                  | —   | 🔶  | ✅   |
| TASK-22  | Units of Work / Tasks    | Set execution mode                          | deterministic/workflow_policy/ai_agent               | —   | 🔶  | ✅   |
| TASK-23  | Units of Work / Tasks    | Set required connectors                     | Connectors this UoW uses                             | —   | 🔶  | ✅   |
| TASK-24  | Units of Work / Tasks    | Set required communications                 | Channel + audience binding                           | —   | 🔶  | ✅   |
| TASK-25  | Units of Work / Tasks    | Tag UoW operation type                      | read / write / update / read-write                   | —   | 🔶  | ✅   |
| TASK-26  | Units of Work / Tasks    | Estimate task cost                          | AI-decide + AI-do + integration                      | —   | 🔶  | ✅   |
| TASK-27  | Units of Work / Tasks    | Set task effectiveness metric               | e.g. time-to-execute baseline                        | —   | 🔶  | ✅   |
| TASK-28  | Units of Work / Tasks    | Escalate overdue tasks (sweep)              | Run unit escalation sweep                            | —   | 🔶  | ✅   |
| TASK-29  | Units of Work / Tasks    | View unit tasks                             | Tasks within a business unit                         | 🔶  | 🔶  | ✅   |
| TASK-30  | Units of Work / Tasks    | Bulk reassign tasks                         | Move many tasks at once                              | —   | 🔶  | ✅   |
| TASK-31  | Units of Work / Tasks    | Triage unassigned tasks                     | Assign from triage queue                             | —   | 🔶  | ✅   |
| TASK-32  | Units of Work / Tasks    | Accept a task assigned to me                | Acknowledge AI-delegated work                        | 🔶  | 🔶  | ✅   |
| TASK-33  | Units of Work / Tasks    | Decline / hand-back a task                  | Reject delegated work                                | 🔶  | 🔶  | ✅   |
| TASK-34  | Units of Work / Tasks    | Build UoW catalog from process              | Decompose a business process into UoWs               | —   | 🔶  | ✅   |
| ONB-01   | Onboarding / Discovery   | Start a discovery run                       | Launch the process-decomposition agent               | —   | 🔶  | ✅   |
| ONB-02   | Onboarding / Discovery   | Upload onboarding documents                 | SOPs, org charts, policies                           | —   | 🔶  | ✅   |
| ONB-03   | Onboarding / Discovery   | Select connections for discovery            | Pick wired connectors to explore                     | —   | 🔶  | ✅   |
| ONB-04   | Onboarding / Discovery   | Answer intake questions                     | Fill gaps the agent raises                           | 🔶  | 🔶  | ✅   |
| ONB-05   | Onboarding / Discovery   | View discovery progress (phases)            | Watch the 8-phase pipeline                           | —   | 🔶  | ✅   |
| ONB-06   | Onboarding / Discovery   | View derived domain graph                   | Entities + edges seed                                | —   | 🔶  | ✅   |
| ONB-07   | Onboarding / Discovery   | View unit-of-work catalog                   | Mined units of work                                  | —   | 🔶  | ✅   |
| ONB-08   | Onboarding / Discovery   | View candidate workflows                    | Synthesized workflows + gates                        | —   | 🔶  | ✅   |
| ONB-09   | Onboarding / Discovery   | View completeness critique                  | What the agent couldn't determine                    | —   | 🔶  | ✅   |
| ONB-10   | Onboarding / Discovery   | View Process Spec                           | The reviewable artifact                              | —   | 🔶  | ✅   |
| ONB-11   | Onboarding / Discovery   | Edit Process Spec                           | Adjust before approval                               | —   | 🔶  | ✅   |
| ONB-12   | Onboarding / Discovery   | Approve Process Spec                        | Approve at the review gate                           | —   | 🔶  | ✅   |
| ONB-13   | Onboarding / Discovery   | Reject / request changes                    | Send the spec back                                   | —   | 🔶  | ✅   |
| ONB-14   | Onboarding / Discovery   | Materialize Process Spec                    | Create units/roles/workflows/connections             | —   | 🔶  | ✅   |
| ONB-15   | Onboarding / Discovery   | View materialization result                 | What got created                                     | —   | 🔶  | ✅   |
| ONB-16   | Onboarding / Discovery   | Inspect a derived fact's source             | Provenance/citation per item                         | —   | 🔶  | ✅   |
| ONB-17   | Onboarding / Discovery   | Resolve an UNVERIFIED flag                  | Confirm/clear a flagged item                         | —   | 🔶  | ✅   |
| ONB-18   | Onboarding / Discovery   | Request missing connector build             | Queue extraction agent for a platform                | —   | 🔶  | ✅   |
| ONB-19   | Onboarding / Discovery   | Set discovery drift trigger                 | Re-derive on doc/spec change                         | —   | 🔶  | ✅   |
| ONB-20   | Onboarding / Discovery   | View spec diff (re-run)                     | Compare to last approved spec                        | —   | 🔶  | ✅   |
| ONB-21   | Onboarding / Discovery   | Provision employees from spec               | Create AI employees post-approval                    | —   | 🔶  | ✅   |
| ONB-22   | Onboarding / Discovery   | Map UoW → business unit                     | Group units of work                                  | —   | 🔶  | ✅   |
| ONB-23   | Onboarding / Discovery   | Estimate cost/effectiveness (spec)          | Per-UoW economics estimate                           | —   | 🔶  | ✅   |
| ONB-24   | Onboarding / Discovery   | Cancel a discovery run                      | Abort an in-flight run                               | —   | 🔶  | ✅   |
| WF-01    | Workflows / Flow         | Create workflow                             | New workflow definition                              | —   | 🔶  | ✅   |
| WF-02    | Workflows / Flow         | Compose workflow from units of work         | Assemble UoWs into a DAG                             | —   | 🔶  | ✅   |
| WF-03    | Workflows / Flow         | View workflow                               | Open one workflow                                    | 🔶  | 🔶  | ✅   |
| WF-04    | Workflows / Flow         | List workflows                              | Browse workflows                                     | 🔶  | 🔶  | ✅   |
| WF-05    | Workflows / Flow         | Add step to workflow                        | Insert a UoW step                                    | —   | 🔶  | ✅   |
| WF-06    | Workflows / Flow         | Remove step                                 | Delete a step                                        | —   | 🔶  | ✅   |
| WF-07    | Workflows / Flow         | Reorder steps                               | Change DAG ordering                                  | —   | 🔶  | ✅   |
| WF-08    | Workflows / Flow         | Set step dependencies                       | Wire depends_on between steps                        | —   | 🔶  | ✅   |
| WF-09    | Workflows / Flow         | Add human gate                              | Insert a HITL checkpoint                             | —   | 🔶  | ✅   |
| WF-10    | Workflows / Flow         | Remove human gate                           | Delete a checkpoint                                  | —   | 🔶  | ✅   |
| WF-11    | Workflows / Flow         | Assign gatekeeper to gate                   | Accountable approver for a step                      | —   | 🔶  | ✅   |
| WF-12    | Workflows / Flow         | Set gate type                               | proposal / approval / budget                         | —   | 🔶  | ✅   |
| WF-13    | Workflows / Flow         | Set step reversibility                      | Flag flip-to-human eligibility                       | —   | 🔶  | ✅   |
| WF-14    | Workflows / Flow         | Tag workflow operation profile              | read-only / read-write / read-write-update / variety | —   | 🔶  | ✅   |
| WF-15    | Workflows / Flow         | Tag workflow proactive/reactive             | How an employee invokes it                           | —   | 🔶  | ✅   |
| WF-16    | Workflows / Flow         | Tag workflow domain/category                | Free-form classification tags                        | —   | 🔶  | ✅   |
| WF-17    | Workflows / Flow         | Bind connectors to workflow                 | Connectors used across steps                         | —   | 🔶  | ✅   |
| WF-18    | Workflows / Flow         | Set workflow trigger                        | event / schedule / message                           | —   | 🔶  | ✅   |
| WF-19    | Workflows / Flow         | Set workflow cadence                        | How often it runs                                    | —   | 🔶  | ✅   |
| WF-20    | Workflows / Flow         | Publish workflow                            | Make runnable                                        | —   | 🔶  | ✅   |
| WF-21    | Workflows / Flow         | Version workflow                            | New immutable revision                               | —   | 🔶  | ✅   |
| WF-22    | Workflows / Flow         | Compare workflow versions                   | Diff revisions                                       | —   | 🔶  | ✅   |
| WF-23    | Workflows / Flow         | Roll back workflow version                  | Revert to a prior revision                           | —   | 🔶  | ✅   |
| WF-24    | Workflows / Flow         | Pause workflow                              | Stop scheduling                                      | —   | 🔶  | ✅   |
| WF-25    | Workflows / Flow         | Resume workflow                             | Restart scheduling                                   | —   | 🔶  | ✅   |
| WF-26    | Workflows / Flow         | Archive workflow                            | Retire a workflow                                    | —   | 🔶  | ✅   |
| WF-27    | Workflows / Flow         | View workflow DAG                           | Visual graph view                                    | 🔶  | 🔶  | ✅   |
| WF-28    | Workflows / Flow         | Simulate / dry-run workflow                 | Test without committing                              | —   | 🔶  | ✅   |
| WF-29    | Workflows / Flow         | Run workflow manually                       | One-off execution                                    | —   | 🔶  | ✅   |
| WF-30    | Workflows / Flow         | Cancel a workflow run                       | Abort an execution                                   | —   | 🔶  | ✅   |
| WF-31    | Workflows / Flow         | View workflow runs                          | Execution history                                    | 🔶  | 🔶  | ✅   |
| WF-32    | Workflows / Flow         | View workflow run trace                     | Step-by-step trace                                   | 🔶  | 🔶  | ✅   |
| WF-33    | Workflows / Flow         | Replay a workflow run                       | Idempotent re-run                                    | —   | 🔶  | ✅   |
| WF-34    | Workflows / Flow         | Combine workflows into employee set         | Group proactive + reactive sets                      | —   | 🔶  | ✅   |
| WF-35    | Workflows / Flow         | Define cross-unit workflow                  | Span multiple business units                         | —   | 🔶  | ✅   |
| WF-36    | Workflows / Flow         | Set workflow cost estimate                  | Expected per-run cost                                | —   | 🔶  | ✅   |
| WF-37    | Workflows / Flow         | Set workflow effectiveness metric           | How success is measured                              | —   | 🔶  | ✅   |
| WF-38    | Workflows / Flow         | View workflow cost/run report               | Runs × cost roll-up                                  | 🔶  | 🔶  | ✅   |
| GATE-01  | Gates & Approvals        | View approval queue                         | Pending gates for me                                 | 🔶  | 🔶  | ✅   |
| GATE-02  | Gates & Approvals        | View an approval                            | Open one gate                                        | 🔶  | 🔶  | ✅   |
| GATE-03  | Gates & Approvals        | Approve & commit                            | Commit an AI proposal                                | 🔶  | 🔶  | ✅   |
| GATE-04  | Gates & Approvals        | Reject a proposal                           | Decline an AI proposal                               | 🔶  | 🔶  | ✅   |
| GATE-05  | Gates & Approvals        | Edit a proposal before commit               | Modify then commit                                   | 🔶  | 🔶  | ✅   |
| GATE-06  | Gates & Approvals        | Dismiss a proposal                          | Drop without action                                  | 🔶  | 🔶  | ✅   |
| GATE-07  | Gates & Approvals        | Act as assigned gatekeeper                  | Commit a gate I own                                  | 🔶  | 🔶  | ✅   |
| GATE-08  | Gates & Approvals        | Delegate a gate decision                    | Hand a gate to another human                         | —   | 🔶  | ✅   |
| GATE-09  | Gates & Approvals        | Decide deploy gate                          | Approve/reject an employee deploy                    | —   | 🔶  | ✅   |
| GATE-10  | Gates & Approvals        | Decide decommission gate                    | Approve/reject a retire                              | —   | 🔶  | ✅   |
| GATE-11  | Gates & Approvals        | Decide autonomy-promote gate                | Approve a rung promotion                             | —   | 🔶  | ✅   |
| GATE-12  | Gates & Approvals        | Decide budget-override gate                 | Approve a budget override                            | —   | 🔶  | ✅   |
| GATE-13  | Gates & Approvals        | Decide schedule-acceptance gate             | Approve a proposed cadence                           | —   | 🔶  | ✅   |
| GATE-14  | Gates & Approvals        | Decide workflow-change gate                 | Approve a workflow diff                              | —   | 🔶  | ✅   |
| GATE-15  | Gates & Approvals        | View gate audit trail                       | Decision history                                     | 🔶  | 🔶  | ✅   |
| GATE-16  | Gates & Approvals        | View override-rate metric                   | Accept/edit/dismiss stats                            | —   | 🔶  | ✅   |
| GATE-17  | Gates & Approvals        | Bulk-approve low-risk proposals             | One-tap batch commit                                 | —   | 🔶  | ✅   |
| GATE-18  | Gates & Approvals        | Flip an AI step to human-responsible        | Reversibility action                                 | —   | 🔶  | ✅   |
| GATE-19  | Gates & Approvals        | Revert a whole unit to human                | Unit-level reversibility                             | —   | 🔶  | ✅   |
| GATE-20  | Gates & Approvals        | Re-open a decided gate                      | Reverse a recent decision                            | —   | 🔶  | ✅   |
| QA-01    | Questions & Answers      | Ask an AI employee a question               | Direct question to an AI worker                      | 🔶  | 🔶  | ✅   |
| QA-02    | Questions & Answers      | View AI employee's answer                   | Read the response                                    | 🔶  | 🔶  | ✅   |
| QA-03    | Questions & Answers      | Rate an AI answer                           | Thumbs/score feedback                                | 🔶  | 🔶  | ✅   |
| QA-04    | Questions & Answers      | View questions directed to me               | AI's questions awaiting my answer                    | 🔶  | 🔶  | ✅   |
| QA-05    | Questions & Answers      | Answer a question from AI                   | Provide the requested info                           | 🔶  | 🔶  | ✅   |
| QA-06    | Questions & Answers      | Defer a question                            | Snooze a question to me                              | 🔶  | 🔶  | ✅   |
| QA-07    | Questions & Answers      | Reassign a question                         | Forward to a colleague                               | 🔶  | 🔶  | ✅   |
| QA-08    | Questions & Answers      | View my answer history                      | Past answers I provided                              | 🔶  | 🔶  | ✅   |
| QA-09    | Questions & Answers      | Attach a document to an answer              | Supply supporting files                              | 🔶  | 🔶  | ✅   |
| QA-10    | Questions & Answers      | Mark a question answered                    | Close the loop                                       | 🔶  | 🔶  | ✅   |
| QA-11    | Questions & Answers      | View Q&A thread                             | Full conversation context                            | 🔶  | 🔶  | ✅   |
| QA-12    | Questions & Answers      | Escalate a question to head                 | Route up when unsure                                 | 🔶  | 🔶  | ✅   |
| QA-13    | Questions & Answers      | View department Q&A backlog                 | All open questions in dept                           | —   | 🔶  | ✅   |
| QA-14    | Questions & Answers      | Set canned/standard answers                 | Reusable answer snippets                             | —   | 🔶  | ✅   |
| QA-15    | Questions & Answers      | Search past Q&A                             | Find prior answers                                   | 🔶  | 🔶  | ✅   |
| QA-16    | Questions & Answers      | View answer SLA / response time             | Turnaround metrics                                   | —   | 🔶  | ✅   |
| CHAT-01  | Communications           | Start chat with an AI employee              | Open an in-app conversation                          | 🔶  | 🔶  | ✅   |
| CHAT-02  | Communications           | Send a chat message                         | Message an AI employee or peer                       | 🔶  | 🔶  | ✅   |
| CHAT-03  | Communications           | Receive AI-initiated chat                   | AI reaches out to me                                 | 🔶  | 🔶  | ✅   |
| CHAT-04  | Communications           | View chat history                           | Past conversations                                   | 🔶  | 🔶  | ✅   |
| CHAT-05  | Communications           | Mute/unmute a conversation                  | Notification control                                 | 🔶  | 🔶  | ✅   |
| CHAT-06  | Communications           | Share a task in chat                        | Reference a task in a message                        | 🔶  | 🔶  | ✅   |
| CHAT-07  | Communications           | Configure comms channel binding             | Channel + audience for a UoW                         | —   | 🔶  | ✅   |
| CHAT-08  | Communications           | Set message contract for a workflow         | Outbound message template                            | —   | 🔶  | ✅   |
| CHAT-09  | Communications           | View department message log                 | Outbound/inbound comms log                           | —   | 🔶  | ✅   |
| CHAT-10  | Communications           | Approve an outbound message                 | Gate AI external comms                               | —   | 🔶  | ✅   |
| CHAT-11  | Communications           | Broadcast announcement to dept              | Notify all dept members                              | —   | 🔶  | ✅   |
| CHAT-12  | Communications           | Set quiet hours / DND                       | Suppress AI pings                                    | 🔶  | 🔶  | ✅   |
| CHAT-13  | Communications           | Flag a message for review                   | Report a comms issue                                 | 🔶  | 🔶  | ✅   |
| CHAT-14  | Communications           | Export conversation transcript              | Download chat history                                | —   | 🔶  | ✅   |
| CON-01   | Connectors & Connections | Browse connector repository                 | List available connectors                            | —   | 🔶  | ✅   |
| CON-02   | Connectors & Connections | View connector spec                         | Property contract + catalogue                        | —   | 🔶  | ✅   |
| CON-03   | Connectors & Connections | View connector status                       | incomplete/research_derived/complete                 | —   | 🔶  | ✅   |
| CON-04   | Connectors & Connections | Configure a connection                      | Create a live connection (validated)                 | —   | 🔶  | ✅   |
| CON-05   | Connectors & Connections | Edit a connection                           | Update connection settings                           | —   | 🔶  | ✅   |
| CON-06   | Connectors & Connections | Delete a connection                         | Remove a connection                                  | —   | 🔶  | ✅   |
| CON-07   | Connectors & Connections | List connections (unit)                     | Connections for a unit                               | —   | 🔶  | ✅   |
| CON-08   | Connectors & Connections | View a connection (masked)                  | Open one (secrets masked)                            | —   | 🔶  | ✅   |
| CON-09   | Connectors & Connections | Test a connection                           | Liveness probe                                       | —   | 🔶  | ✅   |
| CON-10   | Connectors & Connections | Pull a page of records                      | Read data through a connection                       | —   | 🔶  | ✅   |
| CON-11   | Connectors & Connections | Push records                                | Write through a connection                           | —   | 🔶  | ✅   |
| CON-12   | Connectors & Connections | Rotate connection credentials               | Refresh stored secret                                | —   | 🔶  | ✅   |
| CON-13   | Connectors & Connections | Set connection scopes                       | Constrain a connection's access                      | —   | 🔶  | ✅   |
| CON-14   | Connectors & Connections | View connection usage/volume                | Pull/push counts & cost                              | —   | 🔶  | ✅   |
| CON-15   | Connectors & Connections | Request a new connector (research)          | Queue extraction → builder                           | —   | 🔶  | ✅   |
| CON-16   | Connectors & Connections | View research run progress                  | extraction/builder status                            | —   | 🔶  | ✅   |
| CON-17   | Connectors & Connections | Verify connector against docs               | Promote research_derived → complete                  | —   | —   | ✅   |
| CON-18   | Connectors & Connections | Edit connector spec (YAML)                  | Adjust `_props.*.yaml`                               | —   | —   | ✅   |
| CON-19   | Connectors & Connections | Publish connector to catalog                | Register in repository                               | —   | —   | ✅   |
| CON-20   | Connectors & Connections | Deprecate a connector                       | Retire from catalog                                  | —   | —   | ✅   |
| CON-21   | Connectors & Connections | Set connector drift trigger                 | Re-derive on API change                              | —   | —   | ✅   |
| CON-22   | Connectors & Connections | View connector capabilities                 | pull/push/incremental/upsert                         | —   | 🔶  | ✅   |
| CON-23   | Connectors & Connections | Map object/field catalogue                  | Domain-model ↔ api-name mapping                      | —   | —   | ✅   |
| CON-24   | Connectors & Connections | View rate-limit/quota config                | 429 behaviour, quotas                                | —   | 🔶  | ✅   |
| CON-25   | Connectors & Connections | Re-run connector smoke test                 | Validate after change                                | —   | —   | ✅   |
| CON-26   | Connectors & Connections | View connector coverage report              | Repository completeness                              | —   | —   | ✅   |
| KG-01    | Knowledge Graph (Pulse)  | Query the knowledge graph                   | Ask the dept knowledge base                          | —   | 🔶  | ✅   |
| KG-02    | Knowledge Graph (Pulse)  | Search knowledge                            | Full-text/semantic search                            | —   | 🔶  | ✅   |
| KG-03    | Knowledge Graph (Pulse)  | View domain graph                           | Entities + edges                                     | —   | 🔶  | ✅   |
| KG-04    | Knowledge Graph (Pulse)  | View an entity                              | Open an entity node                                  | —   | 🔶  | ✅   |
| KG-05    | Knowledge Graph (Pulse)  | Add an entity                               | Create a domain entity                               | —   | 🔶  | ✅   |
| KG-06    | Knowledge Graph (Pulse)  | Edit an entity                              | Update an entity                                     | —   | 🔶  | ✅   |
| KG-07    | Knowledge Graph (Pulse)  | Add an edge                                 | Create a relationship                                | —   | 🔶  | ✅   |
| KG-08    | Knowledge Graph (Pulse)  | Mark edge sanctioned                        | Allow automation traversal                           | —   | 🔶  | ✅   |
| KG-09    | Knowledge Graph (Pulse)  | Unmark/forbid an edge                       | Block automation traversal                           | —   | 🔶  | ✅   |
| KG-10    | Knowledge Graph (Pulse)  | Delete an edge/entity                       | Remove from the graph                                | —   | 🔶  | ✅   |
| KG-11    | Knowledge Graph (Pulse)  | View sphere freshness                       | alive/stale/never-run per feed                       | —   | 🔶  | ✅   |
| KG-12    | Knowledge Graph (Pulse)  | Trigger a knowledge sync                    | Refresh from connections                             | —   | 🔶  | ✅   |
| KG-13    | Knowledge Graph (Pulse)  | Configure a knowledge feed                  | Bind a connector → sphere                            | —   | 🔶  | ✅   |
| KG-14    | Knowledge Graph (Pulse)  | View knowledge sources                      | Provenance of a fact                                 | —   | 🔶  | ✅   |
| KG-15    | Knowledge Graph (Pulse)  | View knowledge-miss queue                   | Unanswered questions                                 | —   | 🔶  | ✅   |
| KG-16    | Knowledge Graph (Pulse)  | Resolve a knowledge-miss                    | Provide the missing fact                             | 🔶  | 🔶  | ✅   |
| KG-17    | Knowledge Graph (Pulse)  | View knowledge-miss expert tasks            | Tasks auto-created for experts                       | —   | 🔶  | ✅   |
| KG-18    | Knowledge Graph (Pulse)  | Set entity-graph traversal policy           | Edge-guard rules                                     | —   | 🔶  | ✅   |
| KG-19    | Knowledge Graph (Pulse)  | Pin/curate a knowledge item                 | Authoritative override                               | —   | 🔶  | ✅   |
| KG-20    | Knowledge Graph (Pulse)  | Export domain graph                         | Download graph data                                  | —   | 🔶  | ✅   |
| KG-21    | Knowledge Graph (Pulse)  | View graph version history                  | Graph revisions                                      | —   | 🔶  | ✅   |
| KG-22    | Knowledge Graph (Pulse)  | View RAG citations for an answer            | Sources behind a response                            | —   | 🔶  | ✅   |
| KG-23    | Knowledge Graph (Pulse)  | Set knowledge retention policy              | TTL / discard rules                                  | —   | —   | ✅   |
| KG-24    | Knowledge Graph (Pulse)  | View cross-department graph                 | Org-wide knowledge graph                             | —   | —   | ✅   |
| DOC-01   | Documents & Ingestion    | Upload a document                           | Add a doc (PDF/note/etc.)                            | 🔶  | 🔶  | ✅   |
| DOC-02   | Documents & Ingestion    | View a document                             | Open a document                                      | 🔶  | 🔶  | ✅   |
| DOC-03   | Documents & Ingestion    | List documents                              | Browse documents                                     | 🔶  | 🔶  | ✅   |
| DOC-04   | Documents & Ingestion    | Delete a document                           | Remove a document                                    | —   | 🔶  | ✅   |
| DOC-05   | Documents & Ingestion    | Ingest a meeting transcript                 | Structure a transcript into commitments              | —   | 🔶  | ✅   |
| DOC-06   | Documents & Ingestion    | View extracted commitments                  | Tasks lifted from a doc                              | 🔶  | 🔶  | ✅   |
| DOC-07   | Documents & Ingestion    | Confirm/correct an extraction               | Fix a lifted commitment                              | —   | 🔶  | ✅   |
| DOC-08   | Documents & Ingestion    | View document provenance                    | Source + quote                                       | 🔶  | 🔶  | ✅   |
| DOC-09   | Documents & Ingestion    | Tag/classify a document                     | Add metadata/labels                                  | 🔶  | 🔶  | ✅   |
| DOC-10   | Documents & Ingestion    | Search documents                            | Find by content                                      | 🔶  | 🔶  | ✅   |
| DOC-11   | Documents & Ingestion    | Link document to entity                     | Attach to a domain entity                            | —   | 🔶  | ✅   |
| DOC-12   | Documents & Ingestion    | Set ingestion pipeline config               | Parsing/structuring options                          | —   | —   | ✅   |
| DOC-13   | Documents & Ingestion    | Set audio-discard / PII policy              | Compliance on ingestion                              | —   | —   | ✅   |
| DOC-14   | Documents & Ingestion    | Bulk upload documents                       | Ingest many at once                                  | —   | 🔶  | ✅   |
| COST-01  | Cost Control & Budgets   | View cost dashboard                         | Spend overview                                       | —   | 🔶  | ✅   |
| COST-02  | Cost Control & Budgets   | View per-employee cost                      | Cost broken down by employee                         | —   | 🔶  | ✅   |
| COST-03  | Cost Control & Budgets   | View per-workflow cost                      | Cost by workflow                                     | —   | 🔶  | ✅   |
| COST-04  | Cost Control & Budgets   | View cost-per-task                          | Unit economics                                       | —   | 🔶  | ✅   |
| COST-05  | Cost Control & Budgets   | View 3-term cost breakdown                  | AI-decide + AI-do + integration                      | —   | 🔶  | ✅   |
| COST-06  | Cost Control & Budgets   | View spend trend                            | Spend over time                                      | —   | 🔶  | ✅   |
| COST-07  | Cost Control & Budgets   | View projected end-of-month spend           | Forecast                                             | —   | 🔶  | ✅   |
| COST-08  | Cost Control & Budgets   | Adjust cadence dial                         | Run a workflow less/more often                       | —   | 🔶  | ✅   |
| COST-09  | Cost Control & Budgets   | Adjust effort/model tier                    | Cheaper/dearer execution                             | —   | 🔶  | ✅   |
| COST-10  | Cost Control & Budgets   | Set employee budget                         | Monthly cap per employee                             | —   | 🔶  | ✅   |
| COST-11  | Cost Control & Budgets   | Set department budget                       | Dept-level cap                                       | —   | 🔶  | ✅   |
| COST-12  | Cost Control & Budgets   | Set org budget                              | Org-wide cap                                         | —   | —   | ✅   |
| COST-13  | Cost Control & Budgets   | Approve a budget override                   | One-month cap increase                               | —   | 🔶  | ✅   |
| COST-14  | Cost Control & Budgets   | Set budget alert thresholds                 | Notify at % of cap                                   | —   | 🔶  | ✅   |
| COST-15  | Cost Control & Budgets   | View integration (connector) cost           | Pull/push cost                                       | —   | 🔶  | ✅   |
| COST-16  | Cost Control & Budgets   | View ROI (all-in)                           | Effectiveness vs cost incl. HITL                     | —   | 🔶  | ✅   |
| COST-17  | Cost Control & Budgets   | View cost-of-human baseline                 | Human comparison term                                | —   | 🔶  | ✅   |
| COST-18  | Cost Control & Budgets   | View attention-compression budget           | Human-hours saved                                    | —   | 🔶  | ✅   |
| COST-19  | Cost Control & Budgets   | Export cost report                          | Download cost data                                   | —   | 🔶  | ✅   |
| COST-20  | Cost Control & Budgets   | Resume a budget-suspended employee          | Un-pause after review                                | —   | 🔶  | ✅   |
| COST-21  | Cost Control & Budgets   | Recommend cadence reduction                 | Suggest "run less often"                             | —   | 🔶  | ✅   |
| COST-22  | Cost Control & Budgets   | Decommission for cost reasons               | Retire an uneconomic employee                        | —   | 🔶  | ✅   |
| COST-23  | Cost Control & Budgets   | View cost-trace per stage                   | Stage-level cost attribution                         | —   | 🔶  | ✅   |
| COST-24  | Cost Control & Budgets   | Set model-gateway pricing table             | Token→USD rates                                      | —   | —   | ✅   |
| COST-25  | Cost Control & Budgets   | Compare department cost                     | Cross-dept cost view                                 | —   | —   | ✅   |
| COST-26  | Cost Control & Budgets   | Set cost allocation/chargeback              | Bill cost to units                                   | —   | —   | ✅   |
| EFF-01   | Effectiveness & Evals    | View effectiveness scores                   | Per employee/workflow                                | —   | 🔶  | ✅   |
| EFF-02   | Effectiveness & Evals    | Configure effectiveness formula             | Custom calculator                                    | —   | 🔶  | ✅   |
| EFF-03   | Effectiveness & Evals    | Use generic effectiveness formula           | Default metric                                       | —   | 🔶  | ✅   |
| EFF-04   | Effectiveness & Evals    | Run an eval (Ensure)                        | Evaluate an employee                                 | —   | 🔶  | ✅   |
| EFF-05   | Effectiveness & Evals    | View eval results                           | Pass/fail + detail                                   | —   | 🔶  | ✅   |
| EFF-06   | Effectiveness & Evals    | Define eval suite                           | Tests for promotion gates                            | —   | 🔶  | ✅   |
| EFF-07   | Effectiveness & Evals    | View drift signal                           | Behavioral drift detection                           | —   | 🔶  | ✅   |
| EFF-08   | Effectiveness & Evals    | Set drift thresholds                        | Auto-demote triggers                                 | —   | 🔶  | ✅   |
| EFF-09   | Effectiveness & Evals    | View promotion-gate eligibility             | Whether a rung is unlockable                         | —   | 🔶  | ✅   |
| EFF-10   | Effectiveness & Evals    | View override rate                          | Human override frequency                             | —   | 🔶  | ✅   |
| EFF-11   | Effectiveness & Evals    | View rework rate                            | Re-do frequency                                      | —   | 🔶  | ✅   |
| EFF-12   | Effectiveness & Evals    | View SLA adherence                          | On-time performance                                  | —   | 🔶  | ✅   |
| EFF-13   | Effectiveness & Evals    | View turnaround time                        | Time-to-execute                                      | —   | 🔶  | ✅   |
| EFF-14   | Effectiveness & Evals    | View KPI attribution per stage              | KPI → stage mapping                                  | —   | 🔶  | ✅   |
| EFF-15   | Effectiveness & Evals    | View knowledge-gap detection                | Where knowledge is missing                           | —   | 🔶  | ✅   |
| EFF-16   | Effectiveness & Evals    | Set KPI targets                             | Define KPI goals                                     | —   | 🔶  | ✅   |
| EFF-17   | Effectiveness & Evals    | Acknowledge a drift alert                   | Triage drift                                         | —   | 🔶  | ✅   |
| EFF-18   | Effectiveness & Evals    | Export effectiveness report                 | Download metrics                                     | —   | 🔶  | ✅   |
| EFF-19   | Effectiveness & Evals    | Compare employee effectiveness              | Benchmark across employees                           | —   | 🔶  | ✅   |
| EFF-20   | Effectiveness & Evals    | Set org-wide eval standards                 | Global eval baseline                                 | —   | —   | ✅   |
| PRISM-01 | Digital Twin Analytics   | View KPI dashboard                          | Decision-intelligence view                           | —   | 🔶  | ✅   |
| PRISM-02 | Digital Twin Analytics   | Drill KPI → task                            | From metric to commitment                            | —   | 🔶  | ✅   |
| PRISM-03 | Digital Twin Analytics   | Drill task → source                         | To the originating doc                               | —   | 🔶  | ✅   |
| PRISM-04 | Digital Twin Analytics   | Drill source → agent action                 | To the AI action taken                               | —   | 🔶  | ✅   |
| PRISM-05 | Digital Twin Analytics   | View department twin read-model             | Layered department view                              | 🔶  | 🔶  | ✅   |
| PRISM-06 | Digital Twin Analytics   | View employee performance twin              | Per-employee analytics                               | —   | 🔶  | ✅   |
| PRISM-07 | Digital Twin Analytics   | Filter analytics by period                  | Time-range filter                                    | —   | 🔶  | ✅   |
| PRISM-08 | Digital Twin Analytics   | Filter analytics by unit                    | Unit-scoped view                                     | —   | 🔶  | ✅   |
| PRISM-09 | Digital Twin Analytics   | View cost surface                           | Cost overlay on the twin                             | —   | 🔶  | ✅   |
| PRISM-10 | Digital Twin Analytics   | Build a custom report                       | Compose a dashboard                                  | —   | 🔶  | ✅   |
| PRISM-11 | Digital Twin Analytics   | Save a dashboard view                       | Persist a view                                       | —   | 🔶  | ✅   |
| PRISM-12 | Digital Twin Analytics   | Share a dashboard                           | Share with dept                                      | —   | 🔶  | ✅   |
| PRISM-13 | Digital Twin Analytics   | Export analytics                            | Download report                                      | —   | 🔶  | ✅   |
| PRISM-14 | Digital Twin Analytics   | Subscribe to a report digest                | Scheduled email/report                               | 🔶  | 🔶  | ✅   |
| PRISM-15 | Digital Twin Analytics   | View org-wide KPI roll-up                   | Cross-department metrics                             | —   | —   | ✅   |
| PRISM-16 | Digital Twin Analytics   | Set executive scorecard                     | Org-level KPIs                                       | —   | —   | ✅   |
| PROJ-01  | Projects                 | Create a project                            | New project                                          | —   | 🔶  | ✅   |
| PROJ-02  | Projects                 | View a project                              | Open a project                                       | 🔶  | 🔶  | ✅   |
| PROJ-03  | Projects                 | List projects                               | Browse projects                                      | 🔶  | 🔶  | ✅   |
| PROJ-04  | Projects                 | Edit a project                              | Update a project                                     | —   | 🔶  | ✅   |
| PROJ-05  | Projects                 | Set project status                          | planned/active/done/cancelled                        | —   | 🔶  | ✅   |
| PROJ-06  | Projects                 | Link tasks to a project                     | Attach commitments                                   | —   | 🔶  | ✅   |
| PROJ-07  | Projects                 | View project tasks                          | Tasks in a project                                   | 🔶  | 🔶  | ✅   |
| PROJ-08  | Projects                 | View project progress                       | Roll-up of task status                               | 🔶  | 🔶  | ✅   |
| PROJ-09  | Projects                 | Assign project owner                        | Accountable owner                                    | —   | 🔶  | ✅   |
| PROJ-10  | Projects                 | Archive a project                           | Close out a project                                  | —   | 🔶  | ✅   |
| SCH-01   | Schedules & Cadence      | Create a schedule                           | Schedule a workflow/run                              | —   | 🔶  | ✅   |
| SCH-02   | Schedules & Cadence      | View schedules                              | List schedules                                       | —   | 🔶  | ✅   |
| SCH-03   | Schedules & Cadence      | Edit a schedule                             | Change cadence/time                                  | —   | 🔶  | ✅   |
| SCH-04   | Schedules & Cadence      | Pause a schedule                            | Temporarily stop                                     | —   | 🔶  | ✅   |
| SCH-05   | Schedules & Cadence      | Resume a schedule                           | Restart                                              | —   | 🔶  | ✅   |
| SCH-06   | Schedules & Cadence      | Retire a schedule                           | Delete a schedule                                    | —   | 🔶  | ✅   |
| SCH-07   | Schedules & Cadence      | View next-run times                         | Upcoming firings                                     | —   | 🔶  | ✅   |
| SCH-08   | Schedules & Cadence      | Trigger a scheduled run now                 | Run ahead of schedule                                | —   | 🔶  | ✅   |
| SCH-09   | Schedules & Cadence      | View schedule run history                   | Past firings                                         | —   | 🔶  | ✅   |
| SCH-10   | Schedules & Cadence      | Cascade-retire employee schedules           | Auto-retire on decommission                          | —   | 🔶  | ✅   |
| SCH-11   | Schedules & Cadence      | Set SLA/stall timers                        | Deadline/stall handling                              | —   | 🔶  | ✅   |
| SCH-12   | Schedules & Cadence      | Set schedule blackout windows               | No-run periods                                       | —   | 🔶  | ✅   |
| AUD-01   | Audit & Compliance       | View audit ledger                           | Immutable action log                                 | —   | 🔶  | ✅   |
| AUD-02   | Audit & Compliance       | Filter audit by actor/action                | Query the ledger                                     | —   | 🔶  | ✅   |
| AUD-03   | Audit & Compliance       | View per-unit audit                         | Department audit trail                               | —   | 🔶  | ✅   |
| AUD-04   | Audit & Compliance       | View event bus                              | Canonical event stream                               | —   | 🔶  | ✅   |
| AUD-05   | Audit & Compliance       | Export audit log                            | Download for compliance                              | —   | 🔶  | ✅   |
| AUD-06   | Audit & Compliance       | Verify audit hash-chain                     | Integrity check                                      | —   | —   | ✅   |
| AUD-07   | Audit & Compliance       | View compliance report                      | PDPL/RERA evidence                                   | —   | 🔶  | ✅   |
| AUD-08   | Audit & Compliance       | Configure retention policy                  | Audit/data retention                                 | —   | —   | ✅   |
| AUD-09   | Audit & Compliance       | View data-egress log                        | Outbound data record                                 | —   | 🔶  | ✅   |
| AUD-10   | Audit & Compliance       | View PII-handling report                    | PII access/discard                                   | —   | —   | ✅   |
| AUD-11   | Audit & Compliance       | Trace an action end-to-end                  | Full provenance trail                                | —   | 🔶  | ✅   |
| AUD-12   | Audit & Compliance       | Flag an audit anomaly                       | Raise a compliance flag                              | —   | 🔶  | ✅   |
| AUD-13   | Audit & Compliance       | Generate evidence package                   | Bundle for an auditor                                | —   | —   | ✅   |
| AUD-14   | Audit & Compliance       | View employee action history                | All actions by one AI worker                         | —   | 🔶  | ✅   |
| GOV-01   | Governance & Security    | View policy catalog                         | Central policy library                               | —   | 🔶  | ✅   |
| GOV-02   | Governance & Security    | Create a policy                             | New governance policy                                | —   | —   | ✅   |
| GOV-03   | Governance & Security    | Edit a policy                               | Update a policy                                      | —   | —   | ✅   |
| GOV-04   | Governance & Security    | Version a policy                            | New policy revision                                  | —   | —   | ✅   |
| GOV-05   | Governance & Security    | View policy version history                 | Policy revisions                                     | —   | 🔶  | ✅   |
| GOV-06   | Governance & Security    | View policy memories                        | Decision precedents                                  | —   | 🔶  | ✅   |
| GOV-07   | Governance & Security    | Inherit & narrow policy (dept)              | Tighten central policy locally                       | —   | 🔶  | ✅   |
| GOV-08   | Governance & Security    | Set scope-inheritance rules                 | central→unit→employee narrowing                      | —   | —   | ✅   |
| GOV-09   | Governance & Security    | Run authorize-configuration check           | Least-privilege validation                           | —   | 🔶  | ✅   |
| GOV-10   | Governance & Security    | Run authorize-action check                  | Action-time authorization                            | —   | 🔶  | ✅   |
| GOV-11   | Governance & Security    | Verify an identity/principal                | Identity verification                                | —   | 🔶  | ✅   |
| GOV-12   | Governance & Security    | View issued principals                      | Active scoped credentials                            | —   | 🔶  | ✅   |
| GOV-13   | Governance & Security    | Revoke a principal                          | Kill a credential                                    | —   | 🔶  | ✅   |
| GOV-14   | Governance & Security    | Manage secrets vault                        | Store/rotate secrets                                 | —   | —   | ✅   |
| GOV-15   | Governance & Security    | Configure separation of duties              | configurer ≠ approver ≠ auditor                      | —   | —   | ✅   |
| GOV-16   | Governance & Security    | Set PII/egress guardrails                   | Data-protection rules                                | —   | —   | ✅   |
| GOV-17   | Governance & Security    | Kill-switch an employee                     | Instant suspend one worker                           | —   | 🔶  | ✅   |
| GOV-18   | Governance & Security    | Kill-switch a unit                          | Cascade-suspend a unit                               | —   | 🔶  | ✅   |
| GOV-19   | Governance & Security    | Kill-switch the workforce                   | Org-wide emergency stop                              | —   | —   | ✅   |
| GOV-20   | Governance & Security    | View policy-violation alerts                | Blocked-action log                                   | —   | 🔶  | ✅   |
| GOV-21   | Governance & Security    | Override a policy block (with reason)       | Authorized exception                                 | —   | —   | ✅   |
| GOV-22   | Governance & Security    | Set model allow/deny lists                  | Permitted models                                     | —   | —   | ✅   |
| GOV-23   | Governance & Security    | Configure on-prem model routing             | Routing preferences                                  | —   | —   | ✅   |
| GOV-24   | Governance & Security    | Manage role permission matrix               | Edit this RBAC catalog                               | —   | —   | ✅   |
| SET-01   | Notifications & Platform | View notifications                          | Notification inbox                                   | ✅   | ✅   | ✅   |
| SET-02   | Notifications & Platform | Mark notification read                      | Dismiss a notification                               | ✅   | ✅   | ✅   |
| SET-03   | Notifications & Platform | Configure notification rules                | What pings me, when                                  | ✅   | ✅   | ✅   |
| SET-04   | Notifications & Platform | Subscribe to an entity's updates            | Watch a task/employee/workflow                       | 🔶  | 🔶  | ✅   |
| SET-05   | Notifications & Platform | View department settings                    | Dept configuration                                   | 🔶  | 🔶  | ✅   |
| SET-06   | Notifications & Platform | Edit department settings                    | Update dept configuration                            | —   | 🔶  | ✅   |
| SET-07   | Notifications & Platform | Manage platform settings                    | Global system config                                 | —   | —   | ✅   |
| SET-08   | Notifications & Platform | Manage feature flags                        | Toggle platform features                             | —   | —   | ✅   |
| SET-09   | Notifications & Platform | Configure model gateway                     | LLM proxy settings                                   | —   | —   | ✅   |
| SET-10   | Notifications & Platform | Manage adapter registry                     | Runtime adapter catalog                              | —   | —   | ✅   |
| SET-11   | Notifications & Platform | Configure SSO / auth provider               | Identity integration                                 | —   | —   | ✅   |
| SET-12   | Notifications & Platform | View system health                          | Service liveness                                     | —   | 🔶  | ✅   |
| SET-13   | Notifications & Platform | Manage integrations/webhooks                | Outbound webhooks                                    | —   | —   | ✅   |
| SET-14   | Notifications & Platform | Set localization/branding                   | Tenant theming                                       | —   | —   | ✅   |
| SET-15   | Notifications & Platform | View platform usage metrics                 | Org-wide usage                                       | —   | —   | ✅   |
| SET-16   | Notifications & Platform | Export/backup configuration                 | Tenant export                                        | —   | —   | ✅   |
| SET-17   | Notifications & Platform | View release/changelog                      | What changed                                         | ✅   | ✅   | ✅   |
| SET-18   | Notifications & Platform | Submit platform feedback                    | Report an issue/idea                                 | ✅   | ✅   | ✅   |


---

## Summary


| Module                         | Actions  |
| ------------------------------ | -------- |
| Auth & Profile                 | 14       |
| Departments                    | 20       |
| Org Twin & Canvas              | 14       |
| People Management              | 22       |
| Roles & Archetypes             | 16       |
| AI Employee — Lifecycle        | 38       |
| AI Employee — Runtime          | 22       |
| Units of Work / Tasks          | 34       |
| Onboarding / Discovery         | 24       |
| Workflows / Flow               | 38       |
| Gates & Approvals              | 20       |
| Questions & Answers            | 16       |
| Communications                 | 14       |
| Connectors & Connections       | 26       |
| Knowledge Graph (Pulse)        | 24       |
| Documents & Ingestion          | 14       |
| Cost Control & Budgets         | 26       |
| Effectiveness & Evals          | 20       |
| Digital Twin Analytics (Prism) | 16       |
| Projects                       | 10       |
| Schedules & Cadence            | 12       |
| Audit & Compliance             | 14       |
| Governance & Security (Vault)  | 24       |
| Notifications & Platform       | 18       |
| **Total**                      | **~496** |


### Role distribution (rules of thumb)

- **Admin** holds every action (✅ across the matrix), and is the **only** role for
org-wide and platform-level actions: onboarding departments and department heads,
the org-wide digital twin, the global policy catalog, the model gateway, connector
catalog management, and platform settings.
- **Department Head** mirrors the admin's *operational* actions but **scoped to one
department** (🔶): onboarding AI employees, building units of work and workflows,
managing connections + the knowledge graph, cost control, and onboarding human
members (up to member role only — never another head).
- **Department Member** is limited to **participating**: interacting with AI
employees (ask, chat), working the tasks AI assigns them, answering the AI's
questions, and acting as a gatekeeper only on gates explicitly assigned to them.

> This file is the source of truth for the role-permission matrix and is intended to
> be exported to a spreadsheet. Each ID maps to a route + permission scope, so it
> doubles as the backlog for `governance/policy.py` action authorization.

