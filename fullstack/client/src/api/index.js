// ============================================================
// Typed API surface (mirrors doc/build.md §6). The pages never call these
// directly — they go through StoreContext — but this is where the contract
// lives, one function per endpoint.
// ============================================================
import { request } from './client.js';

const c = (cid) => `/companies/${cid}`;

export const api = {
  // companies
  listCompanies: () => request('GET', '/companies'),
  createCompany: (body) => request('POST', '/companies', body),
  getState: (cid) => request('GET', `${c(cid)}/state`),

  // employees / agents
  createEmployee: (cid, body) => request('POST', `${c(cid)}/employees`, body),
  updateEmployee: (cid, id, patch) => request('PATCH', `${c(cid)}/employees/${id}`, patch),
  addChatMessage: (cid, empId, message) => request('POST', `${c(cid)}/employees/${empId}/chat`, message),

  // tasks / issues
  createTask: (cid, body) => request('POST', `${c(cid)}/tasks`, body),
  updateTask: (cid, id, patch) => request('PATCH', `${c(cid)}/tasks/${id}`, patch),

  // approvals
  createApproval: (cid, body) => request('POST', `${c(cid)}/approvals`, body),
  resolveApproval: (cid, id) => request('DELETE', `${c(cid)}/approvals/${id}`),

  // people
  invitePerson: (cid, body) => request('POST', `${c(cid)}/people`, body),

  // connectors
  connectConnector: (cid, id) => request('POST', `${c(cid)}/connectors/${id}/connect`),

  // units of work
  addUnitOfWork: (cid, body) => request('POST', `${c(cid)}/units-of-work`, body),

  // goals & projects (Paperclip)
  createGoal: (cid, body) => request('POST', `${c(cid)}/goals`, body),
  createProject: (cid, body) => request('POST', `${c(cid)}/projects`, body),
};

export default api;
