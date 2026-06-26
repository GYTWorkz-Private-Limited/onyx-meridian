import React, { useState, useRef, useEffect } from 'react';
import { Card, Stat, Pill, Avatar, AgentAvatar, SectionTitle, statusTone, priTone, Modal, Note, Select, SortableTable } from '../components/ui.jsx';
import { useStore } from '../data/StoreContext.jsx';
import { DEPARTMENTS, empById, monthlyCost, effectiveness } from '../data/store.js';
import { Building2, Bot, CheckSquare, DollarSign, Send, MessageSquare, Info, Search, ImagePlus, AtSign, X, Phone, Circle, Users, Plus } from 'lucide-react';
import { CallModal, TaskDetailPage, EmployeeChat } from './operate.jsx';

// Deterministic per-conversation hash so seeded chat history is stable but
// varies between AI employees.
function hashStr(s = '') {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Resolve a task's assignee label (AI codename or human name).
function assigneeLabel(task) {
  if (task.assigneeType === 'ai') return empById(task.assignee)?.name || 'AI';
  return task.assignee || '—';
}

export function Dashboard({ user, role, go }) {
  const { employees, tasks, approvals, questions } = useStore();
  const isHead = role === 'head', isAdmin = role === 'admin';
  const myDept = user.dept;

  if (isAdmin) {
    const totalSpend = employees.reduce((a, e) => a + monthlyCost(e), 0);
    const activeTasks = tasks.filter(t => t.status !== 'done');
    return (
      <div className="flex flex-col gap-6">
        <SectionTitle title="Organization Overview" subtitle="Global AI workforce performance and cost" />
        <div className="grid-cols-4">
          <Stat label="Departments" value={DEPARTMENTS.length} icon={Building2} />
          <Stat label="AI Employees" value={employees.length} delta="+3 this week" icon={Bot} />
          <Stat label="Active Tasks" value={activeTasks.length} delta="-12 from yesterday" icon={CheckSquare} />
          <Stat label="Monthly Run Rate" value={`$${totalSpend.toLocaleString()}`} delta="+$1.2k" icon={DollarSign} />
        </div>
        <div className="grid-cols-2">
          <Card>
            <div className="card-header"><h3>Department Health</h3></div>
            <div className="table-wrap">
              <SortableTable
                rows={DEPARTMENTS.slice(0, 6).map(d => {
                  const emps = employees.filter(e => e.dept === d);
                  return { dept: d, count: emps.length, spend: emps.reduce((a, e) => a + monthlyCost(e), 0) };
                })}
                columns={[
                  { key: 'dept', label: 'Dept', get: r => r.dept },
                  { key: 'count', label: 'AI Employees', get: r => r.count },
                  { key: 'spend', label: 'Monthly Cost', get: r => r.spend },
                ]}
                renderRow={r => <tr key={r.dept}><td className="font-medium">{r.dept}</td><td>{r.count}</td><td>${r.spend.toLocaleString()}</td></tr>}
              />
            </div>
          </Card>
          <Card>
            <div className="card-header"><h3>Recent Approvals</h3><button className="btn btn-outline btn-sm" onClick={() => go('approvals')}>View all</button></div>
            <div className="table-wrap">
              <SortableTable
                rows={approvals.slice(0, 5)}
                columns={[
                  { key: 'type', label: 'Type', get: a => a.type },
                  { key: 'by', label: 'Requested By', get: a => empById(a.requestedBy)?.name || a.requestedBy },
                  { key: 'risk', label: 'Risk', get: a => ({ low: 0, medium: 1, high: 2 }[a.risk] ?? 0) },
                ]}
                renderRow={a => (
                  <tr key={a.id}>
                    <td className="capitalize font-medium">{a.type}</td>
                    <td className="text-muted">{empById(a.requestedBy)?.name || a.requestedBy}</td>
                    <td><Pill label={a.risk} tone={a.risk === 'high' ? 'error' : a.risk === 'medium' ? 'warning' : 'success'} /></td>
                  </tr>
                )}
              />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (isHead) {
    const deptEmps = employees.filter(e => e.dept === myDept);
    const deptTasks = tasks.filter(t => t.dept === myDept);
    const deptSpend = deptEmps.reduce((a, e) => a + monthlyCost(e), 0);
    const timeSaved = deptEmps.reduce((a, e) => a + effectiveness(e).timeSavedHours, 0);
    return (
      <div className="flex flex-col gap-6">
        <SectionTitle title={`${myDept} Dashboard`} subtitle="Department AI operations and effectiveness" />
        <div className="grid-cols-4">
          <Stat label="AI Employees" value={deptEmps.length} icon={Bot} />
          <Stat label="Department Tasks" value={deptTasks.length} icon={CheckSquare} />
          <Stat label="Time Saved / mo" value={`${timeSaved.toLocaleString()}h`} delta="+8%" icon={CheckSquare} />
          <Stat label="Monthly Cost" value={`$${deptSpend.toLocaleString()}`} icon={DollarSign} />
        </div>
        <Card>
          <div className="card-header"><h3>Our AI Employees</h3><button className="btn btn-outline btn-sm" onClick={() => go('employees')}>Manage</button></div>
          <div className="table-wrap">
            <SortableTable
              rows={deptEmps}
              columns={[
                { key: 'name', label: 'Name', get: e => e.name },
                { key: 'role', label: 'Role', get: e => e.title },
                { key: 'status', label: 'Status', get: e => e.status },
                { key: 'tasks', label: 'Tasks Done', get: e => e.tasks_completed },
              ]}
              renderRow={e => (
                <tr key={e.id}>
                  <td className="font-medium flex items-center gap-2"><AgentAvatar id={e.id} name={e.name} size={24} /> {e.name}</td>
                  <td className="text-muted">{e.title}</td>
                  <td><Pill label={e.status} tone={statusTone(e.status)} /></td>
                  <td>{e.tasks_completed.toLocaleString()}</td>
                </tr>
              )}
            />
          </div>
        </Card>
      </div>
    );
  }

  // Member
  const myTasks = tasks.filter(t => t.dept === myDept && t.status !== 'done').slice(0, 5);
  const myQuestions = questions.filter(q => q.status === 'pending' && q.dept === myDept).slice(0, 3);
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title={`Welcome back, ${user.name.split(' ')[0]}`} subtitle="Here is your daily breakdown" />
      <div className="grid-cols-2">
        <Card>
          <div className="card-header"><h3>Active Tasks</h3><button className="btn btn-outline btn-sm" onClick={() => go('taskboard')}>Taskboard</button></div>
          <div className="table-wrap">
            <SortableTable
              rows={myTasks}
              columns={[
                { key: 'task', label: 'Task', get: t => t.title },
                { key: 'priority', label: 'Priority', get: t => ({ low: 0, medium: 1, high: 2, critical: 3 }[t.priority] ?? 0) },
                { key: 'by', label: 'Worked by', get: t => assigneeLabel(t) },
              ]}
              renderRow={t => (
                <tr key={t.id}>
                  <td className="font-medium">{t.title}</td>
                  <td><Pill label={t.priority} tone={priTone(t.priority)} /></td>
                  <td className="text-muted">{assigneeLabel(t)}{t.assigneeType === 'ai' ? ' · AI' : ''}</td>
                </tr>
              )}
            />
          </div>
        </Card>
        <Card>
          <div className="card-header"><h3>AI Questions for You</h3></div>
          <div className="card-body flex flex-col gap-3">
            {myQuestions.length === 0 && <div className="text-muted">No pending questions.</div>}
            {myQuestions.map(q => (
              <div key={q.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium mb-1">{q.title}</div>
                  <div className="text-xs text-muted">From: {empById(q.assignedTo)?.name || q.assignedTo}</div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => go('inbox', { tab: 'ask', conv: q.assignedTo, seed: q })}>Answer</button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function MyWork({ user, role, toast }) {
  const { tasks, moveTask, employees, assignTask } = useStore();
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('all');
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [detail, setDetail] = useState(null);

  // My Work = tasks this human is personally working (not the AI/department board).
  const mine = tasks.filter(t => t.assigneeType === 'human' && t.assignee === user.id);

  // A card click opens the detailed view as a separate page.
  const detailTask = detail ? tasks.find(t => t.id === detail) : null;
  if (detailTask) {
    return <TaskDetailPage task={detailTask} role={role} user={user} employees={employees}
      onBack={() => setDetail(null)} assignTask={assignTask} toast={toast} backLabel="My Work" />;
  }

  const visible = mine.filter(t =>
    (!search || t.title.toLowerCase().includes(search.toLowerCase())) &&
    (priority === 'all' || t.priority === priority));
  const cols = [
    { id: 'todo', label: 'To Do' }, { id: 'in-progress', label: 'In Progress' },
    { id: 'review', label: 'Review' }, { id: 'done', label: 'Done' },
  ].map(c => ({ ...c, items: visible.filter(t => t.status === c.id) }));

  const onDrop = (colId) => { if (dragId) moveTask(dragId, colId); setDragId(null); setOverCol(null); };

  return (
    <div className="flex flex-col h-full gap-4">
      <SectionTitle title="My Work" subtitle="Tasks you are personally working — drag cards between columns to update status. Distinct from the department Taskboard (where AI employees pick up work)." />
      {mine.length === 0 && <Note icon={Info}>You have no tasks assigned to you right now. Tasks you create on the Taskboard and keep for yourself appear here.</Note>}

      {mine.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative" style={{ width: 240 }}>
            <Search className="absolute left-3 top-2.5 text-muted" size={16} />
            <input className="search-input has-icon" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ width: 150 }}>
            <Select value={priority} onChange={setPriority} options={[{ value: 'all', label: 'All priorities' }, 'low', 'medium', 'high', 'critical']} />
          </div>
          {(search || priority !== 'all') && <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setPriority('all'); }}>Clear</button>}
          <span className="text-xs text-muted ml-auto">{visible.length} of {mine.length} tasks</span>
        </div>
      )}

      <div className="kanban">
        {cols.map(col => (
          <div key={col.id} className="kanban-col"
            style={{ outline: overCol === col.id ? '2px dashed var(--blue-400)' : 'none', outlineOffset: -2 }}
            onDragOver={e => { e.preventDefault(); setOverCol(col.id); }}
            onDragLeave={() => setOverCol(c => c === col.id ? null : c)}
            onDrop={() => onDrop(col.id)}>
            <div className="kanban-col-header"><span>{col.label}</span><span className="badge">{col.items.length}</span></div>
            <div className="kanban-col-body">
              {col.items.map(t => (
                <div key={t.id} className="kanban-card" draggable onClick={() => setDetail(t.id)}
                  onDragStart={() => setDragId(t.id)} onDragEnd={() => { setDragId(null); setOverCol(null); }}
                  style={{ opacity: dragId === t.id ? 0.4 : 1, cursor: 'grab' }}>
                  <div className="font-medium text-sm leading-tight">{t.title}</div>
                  <div className="flex items-center justify-between">
                    <Pill label={t.priority} tone={priTone(t.priority)} />
                    <span className="text-xs text-muted">{t.dueDate}</span>
                  </div>
                </div>
              ))}
              {col.items.length === 0 && <div className="text-xs text-muted text-center py-4" style={{ opacity: 0.7 }}>Drop here</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Inbox({ user, role, toast, navParams }) {
  const { questions: allQuestions, employees, addApproval } = useStore();
  // Admin oversees the whole org; department users see only their own inbox.
  const questions = allQuestions.filter(q => role === 'admin' || q.dept === user.dept);
  const [chatInput, setChatInput] = useState('');
  const [attachments, setAttachments] = useState([]); // { id, name, url }
  const [tagged, setTagged] = useState([]); // emp objects
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null); // active "@…" search, or null
  const fileRef = useRef(null);
  const [active, setActive] = useState('dept'); // active conversation id
  const [readConvs, setReadConvs] = useState(() => new Set()); // convs whose unread questions were seen
  const [threads, setThreads] = useState({}); // { [convId]: [msgs] }
  const [callEmp, setCallEmp] = useState(null);
  const [convSearch, setConvSearch] = useState('');
  const [groups, setGroups] = useState([]); // { id, name, members:[emp] }
  const [groupModal, setGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState([]); // emp ids

  const scopedEmployees = employees.filter(e => e.status === 'active' && (role === 'admin' || e.dept === user.dept));
  const firstName = user.name.split(' ')[0];

  // WhatsApp/Teams-style conversation list: the department assistant, group chats, then each AI employee.
  const groupConvs = groups.map(g => ({
    id: g.id, name: g.name, sub: `${g.members.length} AI employee${g.members.length > 1 ? 's' : ''}`,
    initials: g.name[0], online: true, emp: null, group: true, members: g.members,
  }));
  const conversations = [
    { id: 'dept', name: 'Department Assistant', sub: 'Routes to the right AI employee', initials: 'AI', online: true, emp: null },
    ...groupConvs,
    ...scopedEmployees.map(e => ({ id: e.id, name: e.name, sub: e.title, initials: e.name[0], online: e.status === 'active', emp: e })),
  ];
  // Questions an AI raised become "unread messages" on its chat. We surface only
  // the few most urgent open ones so the inbox stays focused, grouped by the
  // employee who raised them.
  const URGENCY_RANK = { high: 3, medium: 2, low: 1 };
  const MAX_OPEN_QUESTIONS = 4;
  const topPending = questions
    .filter(q => q.status === 'pending')
    .sort((a, b) => (URGENCY_RANK[b.urgency] || 0) - (URGENCY_RANK[a.urgency] || 0))
    .slice(0, MAX_OPEN_QUESTIONS);
  const pendingByEmp = {};
  topPending.forEach(q => {
    (pendingByEmp[q.assignedTo] = pendingByEmp[q.assignedTo] || []).push(q);
  });
  const pendingCount = (c) => (c.emp && pendingByEmp[c.id]?.length) || 0;
  const unreadFor = (c) => (readConvs.has(c.id) ? 0 : pendingCount(c));
  const totalUnread = conversations.reduce((a, c) => a + unreadFor(c), 0);

  const openConv = (id) => { setActive(id); setReadConvs(prev => new Set(prev).add(id)); };

  const matchesSearch = (c) => c.name.toLowerCase().includes(convSearch.toLowerCase()) || c.sub.toLowerCase().includes(convSearch.toLowerCase());
  // Pin the assistant + groups; order employees so those with raised questions lead.
  const convFiltered = [
    ...conversations.filter(c => (c.id === 'dept' || c.group) && matchesSearch(c)),
    ...conversations.filter(c => c.emp && matchesSearch(c)).sort((a, b) => pendingCount(b) - pendingCount(a)),
  ];
  const activeConv = conversations.find(c => c.id === active) || conversations[0];
  const greeting = (conv) => conv.id === 'dept'
    ? 'Hello! I am your department AI assistant. How can I help you today?'
    : conv.group
      ? `Group chat created with ${conv.members.map(m => m.name).join(', ')}. @tag anyone to ask a question — they'll each respond.`
      : `Hi ${firstName}, ${conv.name} here. What do you need?`;

  // A lived-in chat history per AI employee: a few past exchanges, deterministic
  // per conversation so it stays stable across renders but reads differently for
  // each employee. Group/assistant chats start fresh with just a greeting.
  const seedThread = (conv) => {
    if (!conv || conv.id === 'dept' || conv.group || !conv.emp) {
      return [{ id: 1, role: 'ai', text: greeting(conv) }];
    }
    const emp = conv.emp;
    const dept = (emp.dept || 'your department');
    const peer = scopedEmployees.find(e => e.dept === emp.dept && e.id !== emp.id);
    const h = hashStr(conv.id);
    const pick = (arr, salt = 0) => arr[(h + salt) % arr.length];

    // Exchange builders → [userText, aiText]. Each varies per employee.
    const ex = {
      status: () => [
        pick(['Quick status on your queue?', 'Where are things at this morning?', 'Catch me up — what’s in flight?'], 1),
        pick([
          `Cleared ${6 + (h % 9)} of ${14 + (h % 8)} items so far — the rest are mid-run. Nothing blocking.`,
          `Working the ${dept} backlog now; about two-thirds through. I’ll flag anything that needs you.`,
          `Steady — overnight queue is drained and I’m onto today’s ${emp.title.toLowerCase()} work.`,
        ], 2),
      ],
      savings: () => [
        pick(['What did yesterday’s run save us?', 'How much time did this week save?', 'Recap the impact so far.'], 3),
        pick([
          `Roughly ${4 + (h % 6)}.${h % 9}h and ~$${300 + (h % 700)} vs. the manual baseline — logged to your effectiveness view.`,
          `About ${(20 + (h % 40))}h saved this month and a few hundred dollars avoided. Trending up week over week.`,
        ], 4),
      ],
      approval: () => [
        pick(['Anything waiting on me?', 'Is there anything that needs my sign-off?', 'Do you need approvals from me?'], 5),
        pick([
          `One item — I routed an action to your Approvals. Everything read-only auto-cleared.`,
          `Just one: a write step is parked in Approvals pending your OK. The rest is done.`,
        ], 6),
      ],
      peer: () => peer ? [
        pick([`Are you coordinating with ${peer.name}?`, `Loop in ${peer.name} if you need to.`], 7),
        pick([
          `Yep — handed the downstream steps to ${peer.name} (${peer.title}); I’ll consolidate the results.`,
          `Already in sync with ${peer.name}. I pass cleared items over and they handle the follow-through.`,
        ], 8),
      ] : ex.status(),
    };

    // Pick 2–3 distinct exchanges deterministically.
    const order = ['status', 'savings', 'approval', 'peer'];
    const start = h % order.length;
    const count = 2 + (h % 2); // 2 or 3
    const chosen = Array.from({ length: count }, (_, i) => order[(start + i) % order.length]);

    const msgs = [{ id: 1, role: 'ai', text: greeting(conv) }];
    let id = 2;
    chosen.forEach(k => {
      const [u, a] = ex[k]();
      msgs.push({ id: id++, role: 'user', text: u });
      msgs.push({ id: id++, role: 'ai', text: a });
    });
    return msgs;
  };

  const messages = threads[active] || seedThread(activeConv);
  const lastPreview = (conv) => {
    // Unread raised questions take over the preview, like an unread message.
    if (unreadFor(conv) > 0) return pendingByEmp[conv.id][0].title;
    const t = threads[conv.id];
    if (!t || t.length === 0) return conv.sub;
    const last = t[t.length - 1];
    return (last.role === 'user' ? 'You: ' : '') + (last.text || (last.images?.length ? '📷 Image' : conv.sub));
  };

  const onPickFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files.map(f => ({ id: `${f.name}-${f.size}`, name: f.name, url: URL.createObjectURL(f) }))]);
    e.target.value = '';
  };
  const removeAttachment = (id) => setAttachments(prev => prev.filter(a => a.id !== id));
  const toggleTag = (emp) => setTagged(prev => prev.some(t => t.id === emp.id) ? prev.filter(t => t.id !== emp.id) : [...prev, emp]);
  const removeTag = (id) => setTagged(prev => prev.filter(t => t.id !== id));

  // typing "@…" in the message box opens the employee picker, filtered live
  const onChatChange = (val) => {
    setChatInput(val);
    const m = val.match(/(?:^|\s)@([\w]*)$/);
    if (m) { setMentionQuery(m[1].toLowerCase()); setPickerOpen(true); }
    else { setMentionQuery(null); if (pickerOpen) setPickerOpen(false); }
  };
  const pickEmps = scopedEmployees.filter(e =>
    mentionQuery == null || mentionQuery === '' ||
    e.name.toLowerCase().includes(mentionQuery) || e.title.toLowerCase().includes(mentionQuery));
  // select from picker: tag the employee and, if triggered by "@", strip the token
  const selectEmp = (emp) => {
    setTagged(prev => prev.some(t => t.id === emp.id) ? prev : [...prev, emp]);
    if (mentionQuery != null) {
      setChatInput(prev => prev.replace(/(^|\s)@(\w*)$/, '$1'));
      setMentionQuery(null);
    }
    setPickerOpen(false);
  };

  const pushMsg = (convId, msg) => setThreads(prev => {
    const base = prev[convId] || seedThread(conversations.find(c => c.id === convId) || activeConv);
    return { ...prev, [convId]: [...base, msg] };
  });

  // Deep-link from the Dashboard "Answer" button: open the chat with the AI that
  // raised the question. Employee chats surface the question themselves (via
  // EmployeeChat's seeded questions); for the assistant/group we seed the thread.
  useEffect(() => {
    if (!navParams?.conv) return;
    openConv(navParams.conv);
    const seed = navParams.seed;
    const conv = conversations.find(c => c.id === navParams.conv);
    if (seed && conv && !conv.emp) {
      setThreads(prev => {
        if (prev[navParams.conv]) return prev; // don't clobber an existing thread
        const base = seedThread(conv);
        return {
          ...prev,
          [navParams.conv]: [
            ...base,
            { id: Date.now(), role: 'ai', text: `I raised a question: ${seed.title}${seed.body ? ` — ${seed.body}` : ''}`, responder: conv?.name },
          ],
        };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navParams]);

  const handleSend = () => {
    if (!chatInput.trim() && attachments.length === 0) return;
    const sentTags = tagged;
    const sentImages = attachments;
    const convId = active;
    pushMsg(convId, { id: Date.now(), role: 'user', text: chatInput, images: sentImages, tags: sentTags.map(t => t.name) });
    setChatInput(''); setAttachments([]); setTagged([]);
    const imgNote = sentImages.length ? ` and review the ${sentImages.length} attached image${sentImages.length > 1 ? 's' : ''}` : '';

    // Group chat: each @tagged member answers; if no one is tagged, every member chimes in.
    if (activeConv.group) {
      const responders = sentTags.length ? sentTags : activeConv.members;
      responders.forEach((m, i) => {
        const reply = `${m.name} here — on it for ${firstName}. I'll handle my part${imgNote} and post back in the group.`;
        setTimeout(() => pushMsg(convId, { id: Date.now() + 1 + i, role: 'ai', text: reply, responder: m.name }), 700 + i * 600);
      });
      return;
    }

    // Whoever's conversation this is replies; an @tag pulls in a colleague.
    const speaker = activeConv.emp ? activeConv.emp.name : (sentTags[0]?.name || null);
    const looped = sentTags.find(t => t.id !== activeConv.id);
    const reply = speaker
      ? `${speaker} here — on it for ${firstName}. I'll action this${imgNote}${looped ? `, and loop in ${looped.name}` : ''}, then update the Taskboard.`
      : `Understood — routing this to the right AI employee${imgNote}. I'll update the Taskboard.`;
    setTimeout(() => pushMsg(convId, { id: Date.now() + 1, role: 'ai', text: reply, responder: speaker || 'AI' }), 800);
  };

  const toggleGroupMember = (id) => setNewGroupMembers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const createGroup = () => {
    const members = scopedEmployees.filter(e => newGroupMembers.includes(e.id));
    if (members.length === 0) return;
    const id = `grp-${Date.now()}`;
    const name = newGroupName.trim() || members.map(m => m.name.split(' ')[0]).join(', ');
    setGroups(prev => [...prev, { id, name, members }]);
    setGroupModal(false); setNewGroupName(''); setNewGroupMembers([]);
    setActive(id);
    toast('Group chat created.', 'success');
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <SectionTitle title="Inbox"
        subtitle={totalUnread > 0
          ? `${totalUnread} question${totalUnread > 1 ? 's' : ''} from your AI workforce waiting on you — open a chat to answer.`
          : 'Questions your AI workforce raised, and a place to ask them'} />

      {(
        <Card className="flex-1 min-h-[560px] p-0 overflow-hidden">
          <div className="msgr">
            {/* conversation list */}
            <div className="msgr-list">
              <div className="msgr-list-head flex flex-col gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-muted" size={15} />
                  <input className="search-input has-icon" style={{ fontSize: 13 }} placeholder="Search chats…" value={convSearch} onChange={e => setConvSearch(e.target.value)} />
                </div>
                <button className="btn btn-outline btn-sm" style={{ justifyContent: 'center' }} onClick={() => setGroupModal(true)}><Plus size={15} /> New group chat</button>
              </div>
              <div className="msgr-list-body">
                {convFiltered.map(c => {
                  const unread = unreadFor(c);
                  return (
                  <button key={c.id} className={`msgr-item ${active === c.id ? 'on' : ''} ${unread ? 'unread' : ''}`} onClick={() => openConv(c.id)}>
                    <div className="relative">
                      {c.group
                        ? <div className="grp-avatar" style={{ width: 40, height: 40 }}><Users size={18} /></div>
                        : c.emp
                          ? <AgentAvatar id={c.emp.id} name={c.emp.name} size={40} />
                          : <Avatar initials={c.initials} size={40} className="avatar-ai" />}
                      {c.online && <span className="msgr-online" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">{c.name}</span>
                        {unread > 0 && <span className="msgr-badge">{unread}</span>}
                      </div>
                      <div className={`text-xs truncate ${unread ? 'text-gray-900 font-medium' : 'text-muted'}`}>{lastPreview(c)}</div>
                    </div>
                  </button>
                  );
                })}
              </div>
            </div>

            {/* chat panel */}
            <div className="msgr-panel">
              {activeConv.emp ? (
                /* Single AI employee → full EmployeeChat engine (step traces,
                   result cards, inline approvals) — same as Employees → Chat. */
                <EmployeeChat key={activeConv.emp.id} emp={activeConv.emp} user={user} addApproval={addApproval} toast={toast}
                  seedQuestions={pendingByEmp[activeConv.emp.id]} />
              ) : (
              <>
              <div className="msgr-head">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {activeConv.group
                      ? <div className="grp-avatar" style={{ width: 38, height: 38 }}><Users size={17} /></div>
                      : <Avatar initials={activeConv.initials} size={38} className="avatar-ai" />}
                    {activeConv.online && <span className="msgr-online" />}
                  </div>
                  <div>
                    <div className="font-semibold">{activeConv.name}</div>
                    <div className="text-xs text-muted flex items-center gap-1">
                      {activeConv.group
                        ? <><Users size={11} /> {activeConv.members.map(m => m.name).join(', ')}</>
                        : <>{activeConv.online ? <><Circle size={7} className="text-green-500" style={{ fill: 'currentColor' }} /> Online</> : 'Offline'}
                          {activeConv.emp && <> · {activeConv.emp.dept}</>}</>}
                    </div>
                  </div>
                </div>
                {activeConv.emp && (
                  <button className="btn btn-call btn-sm" onClick={() => setCallEmp(activeConv.emp)}><Phone size={14} /> Call</button>
                )}
              </div>

              <div className="chat-body">
                {messages.map(m => (
                  <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                    {m.role === 'ai' && <Avatar initials={(m.responder || activeConv.initials)[0]} size={32} className="avatar-ai" />}
                    <div className="flex flex-col gap-1" style={{ alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
                      {m.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {m.tags.map(t => <span key={t} className="tag-chip"><AtSign size={11} /> {t}</span>)}
                        </div>
                      )}
                      {m.images?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {m.images.map(img => <img key={img.id} src={img.url} alt={img.name} className="chat-thumb" />)}
                        </div>
                      )}
                      {m.text && <div className={`chat-bubble ${m.role}`}>{m.text}</div>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="composer-rich">
            {(tagged.length > 0 || attachments.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-2">
                {tagged.map(t => (
                  <span key={t.id} className="tag-chip">
                    <AtSign size={11} /> {t.name}
                    <button onClick={() => removeTag(t.id)} className="tag-x"><X size={11} /></button>
                  </span>
                ))}
                {attachments.map(a => (
                  <span key={a.id} className="attach-chip">
                    <img src={a.url} alt={a.name} className="attach-thumb" />
                    <span className="truncate" style={{ maxWidth: 90 }}>{a.name}</span>
                    <button onClick={() => removeAttachment(a.id)} className="tag-x"><X size={11} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 items-center relative">
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPickFiles} />
              <button className="gem-iconbtn" title="Attach image" onClick={() => fileRef.current?.click()}><ImagePlus size={18} /></button>
              <button className={`gem-iconbtn ${pickerOpen ? 'on' : ''}`} title="Tag an AI employee" onClick={() => { setMentionQuery(null); setPickerOpen(o => !o); }}><AtSign size={18} /></button>
              {pickerOpen && (
                <div className="tag-picker">
                  <div className="tag-picker-head">{mentionQuery != null ? (mentionQuery ? `AI employees matching “${mentionQuery}”` : 'Tag an AI employee') : 'Tag an AI employee'}</div>
                  {pickEmps.length === 0 && <div className="px-3 py-2 text-xs text-muted">No matching AI employees in scope.</div>}
                  {pickEmps.map(e => (
                    <button key={e.id} className="tag-picker-item" onClick={() => selectEmp(e)}>
                      <AgentAvatar id={e.id} name={e.name} size={24} />
                      <div className="text-left flex-1"><div className="text-sm font-medium">{e.name}</div><div className="text-xs text-muted">{e.title} · {e.dept}</div></div>
                      {tagged.some(t => t.id === e.id) && <span className="text-xs text-blue-600">tagged</span>}
                    </button>
                  ))}
                </div>
              )}
              <input className="search-input" style={{ flex: 1 }} placeholder={tagged.length ? `Message ${tagged.map(t => t.name).join(', ')}…` : `Message ${activeConv.name}, @tag an AI employee…`} value={chatInput}
                onChange={e => onChatChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend(); if (e.key === 'Escape') { setPickerOpen(false); setMentionQuery(null); } }} />
              <button className="btn btn-primary" onClick={handleSend}><Send size={16} /></button>
            </div>
          </div>
              </>
              )}
            </div>
          </div>
        </Card>
      )}
      {callEmp && <CallModal emp={callEmp} user={user} onClose={() => setCallEmp(null)} />}

      <Modal open={groupModal} onClose={() => setGroupModal(false)} title="New group chat">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">Start a collaboration thread, add AI employees, then @tag anyone to ask questions — each tagged employee replies in the group.</p>
          <div>
            <label className="text-sm font-medium">Group name <span className="text-muted">(optional)</span></label>
            <input className="search-input mt-1" placeholder="e.g. Q3 Lease Renewals" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Add AI employees ({newGroupMembers.length} selected)</label>
            <div className="flex flex-col gap-1 mt-1 border rounded" style={{ maxHeight: 260, overflowY: 'auto' }}>
              {scopedEmployees.map(e => {
                const on = newGroupMembers.includes(e.id);
                return (
                  <button key={e.id} className="tag-picker-item" style={{ background: on ? 'var(--blue-50)' : 'none' }} onClick={() => toggleGroupMember(e.id)}>
                    <AgentAvatar id={e.id} name={e.name} size={26} />
                    <div className="text-left flex-1"><div className="text-sm font-medium">{e.name}</div><div className="text-xs text-muted">{e.title} · {e.dept}</div></div>
                    {on && <CheckSquare size={16} className="text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button className="btn btn-ghost" onClick={() => setGroupModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={newGroupMembers.length === 0} onClick={createGroup}>Create group</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
