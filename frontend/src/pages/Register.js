import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="card shadow p-4" style={{ width: '100%', maxWidth: 420 }}>
        <h3 className="text-center mb-4 fw-bold text-primary">Task Manager</h3>
        <h5 className="text-center mb-3">Create Account</h5>

        {error && <div id="register-error" className="alert alert-danger py-2">{error}</div>}

        <form id="register-form" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input id="reg-name" type="text" className="form-control"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              required placeholder="John Doe" />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input id="reg-email" type="email" className="form-control"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              required placeholder="you@example.com" />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input id="reg-password" type="password" className="form-control"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              required placeholder="Min 6 characters" minLength={6} />
          </div>
          <button id="register-btn" type="submit" className="btn btn-success w-100" disabled={loading}>
            {loading ? 'Creating…' : 'Register'}
          </button>
        </form>

        <p className="text-center mt-3 mb-0">
          Have an account? <Link id="go-login" to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
