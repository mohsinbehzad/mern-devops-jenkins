import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="card shadow p-4" style={{ width: '100%', maxWidth: 420 }}>
        <h3 className="text-center mb-4 fw-bold text-primary">Task Manager</h3>
        <h5 className="text-center mb-3">Sign In</h5>

        {error && <div id="login-error" className="alert alert-danger py-2">{error}</div>}

        <form id="login-form" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input id="login-email" type="email" className="form-control"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              required placeholder="you@example.com" />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input id="login-password" type="password" className="form-control"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              required placeholder="••••••" />
          </div>
          <button id="login-btn" type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-3 mb-0">
          No account? <Link id="go-register" to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
