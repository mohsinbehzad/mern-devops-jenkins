import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['pending', 'in-progress', 'completed'];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', status: 'pending', dueDate: '' });
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    const res = await axios.get('/api/tasks');
    setTasks(res.data);
  };

  useEffect(() => { fetchTasks(); }, []);

  const openCreate = () => {
    setEditTask(null);
    setForm({ title: '', description: '', status: 'pending', dueDate: '' });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({ title: task.title, description: task.description, status: task.status, dueDate: task.dueDate || '' });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    setLoading(true);
    try {
      if (editTask) {
        await axios.put(`/api/tasks/${editTask._id}`, form);
      } else {
        await axios.post('/api/tasks', form);
      }
      await fetchTasks();
      setShowModal(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await axios.delete(`/api/tasks/${id}`);
    await fetchTasks();
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const filtered = tasks.filter(t => {
    const matchStatus = filter === 'all' || t.status === filter;
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const badgeClass = (s) =>
    s === 'completed' ? 'bg-success' : s === 'in-progress' ? 'bg-warning text-dark' : 'bg-secondary';

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-primary px-4">
        <span className="navbar-brand fw-bold">Task Manager</span>
        <div className="d-flex align-items-center gap-3">
          <span id="user-name" className="text-white">Hello, {user?.name}</span>
          <button id="logout-btn" className="btn btn-outline-light btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="container py-4">
        {/* Controls */}
        <div className="d-flex flex-wrap gap-2 mb-4 align-items-center justify-content-between">
          <div className="d-flex gap-2">
            <input id="search-box" type="text" className="form-control" placeholder="Search tasks…"
              value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
            <select id="status-filter" className="form-select" style={{ width: 160 }}
              value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button id="new-task-btn" className="btn btn-primary" onClick={openCreate}>+ New Task</button>
        </div>

        {/* Stats */}
        <div className="row mb-4 g-3">
          {[['All', tasks.length, 'bg-primary'], ['Pending', tasks.filter(t=>t.status==='pending').length, 'bg-secondary'],
            ['In Progress', tasks.filter(t=>t.status==='in-progress').length, 'bg-warning text-dark'],
            ['Completed', tasks.filter(t=>t.status==='completed').length, 'bg-success']].map(([label, count, cls]) => (
            <div key={label} className="col-6 col-md-3">
              <div className={`card text-white ${cls} text-center p-3`}>
                <div className="fs-3 fw-bold">{count}</div>
                <div className="small">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Task list */}
        {filtered.length === 0 ? (
          <p className="text-muted text-center mt-5" id="no-tasks">No tasks found.</p>
        ) : (
          <div className="row g-3">
            {filtered.map(task => (
              <div key={task._id} className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm task-card" data-id={task._id}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="card-title mb-0 task-title">{task.title}</h6>
                      <span className={`badge ${badgeClass(task.status)} task-status ms-2`}>{task.status}</span>
                    </div>
                    {task.description && <p className="card-text small text-muted">{task.description}</p>}
                    {task.dueDate && <p className="card-text small"><strong>Due:</strong> {task.dueDate}</p>}
                  </div>
                  <div className="card-footer d-flex gap-2">
                    <button className="btn btn-sm btn-outline-primary edit-task-btn flex-fill"
                      onClick={() => openEdit(task)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger delete-task-btn flex-fill"
                      onClick={() => handleDelete(task._id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editTask ? 'Edit Task' : 'New Task'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {formError && <div id="task-form-error" className="alert alert-danger py-2">{formError}</div>}
                  <div className="mb-3">
                    <label className="form-label">Title *</label>
                    <input id="task-title-input" type="text" className="form-control"
                      value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea id="task-desc-input" className="form-control" rows={2}
                      value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select id="task-status-input" className="form-select"
                      value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Due Date</label>
                    <input id="task-due-input" type="date" className="form-control"
                      value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button id="save-task-btn" type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving…' : editTask ? 'Update Task' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
