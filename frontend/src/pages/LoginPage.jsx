import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';
import api from '../api/axios';

function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: request, 2: verify
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setResetMsg('');
    try {
      await api.post('/auth/request-reset', { email: resetEmail });
      setResetMsg('OTP sent to your email.');
      setResetStep(2);
    } catch (err) {
      setResetMsg(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetMsg('');
    try {
      await api.post('/auth/reset-password', { email: resetEmail, code: resetCode, newPassword });
      setResetMsg('Password reset successful. Please login.');
      setShowReset(false);
      setResetStep(1);
      setResetEmail('');
      setResetCode('');
      setNewPassword('');
    } catch (err) {
      setResetMsg(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="auth-container">
      <h2>Login to TASKWAVE</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        {error && <div className="auth-error">{error}</div>}
      </form>
      <div className="auth-link" style={{ marginTop: '0.5rem' }}>
        <button type="button" onClick={() => setShowReset(true)} style={{ background: 'none', border: 'none', color: '#4f8cff', cursor: 'pointer', padding: 0 }}>
          Forgot Password?
        </button>
      </div>
      <div className="auth-link">
        Don't have an account? <a href="/register">Register</a>
      </div>

      {showReset && (
        <div className="modal-overlay" onClick={() => setShowReset(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Reset Password</h3>
            {resetStep === 1 ? (
              <form onSubmit={handleRequestReset} className="auth-form">
                <input
                  type="email"
                  placeholder="Registered Gmail"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                />
                <button type="submit">Send OTP</button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="auth-form">
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={resetCode}
                  onChange={e => setResetCode(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
                <button type="submit">Reset Password</button>
              </form>
            )}
            {resetMsg && <div className="auth-error" style={{ marginTop: '0.5rem' }}>{resetMsg}</div>}
            <div className="auth-link" style={{ marginTop: '0.75rem' }}>
              <button type="button" onClick={() => { setShowReset(false); setResetStep(1); }} style={{ background: 'none', border: '1px solid #ccc', padding: '0.4rem 0.8rem', borderRadius: 6, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage; 