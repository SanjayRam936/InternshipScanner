import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password, remember);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'LOGIN_FAILED: Invalid credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-lines" aria-hidden="true" />

      <div className="auth-card bracket-box">
        <div className="bracket-box-inner">
          <div className="auth-header">
            <h1 className="auth-wordmark">SCANNER</h1>
            <span className="tag tag-muted">SYS_VER_1.4.2</span>
          </div>

          <div className="auth-title-row">
            <p className="font-mono text-upper" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              SYSTEM ACCESS PORTAL
            </p>
          </div>

          {error && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form id="login-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-fields">
              <div className="form-group">
                <label className="form-label" htmlFor="login-identifier">
                  IDENTIFIER
                </label>
                <input
                  id="login-identifier"
                  className="form-input"
                  type="text"
                  placeholder="USERNAME"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-security-key">
                  SECURITY_KEY
                </label>
                <div className="auth-password-wrap">
                  <input
                    id="login-security-key"
                    className="form-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    id="toggle-password-btn"
                  >
                    {showPass ? '●' : '○'}
                  </button>
                </div>
              </div>
            </div>

            <div className="auth-row">
              <label className="auth-checkbox-label" htmlFor="login-keep-active">
                <input
                  id="login-keep-active"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="font-mono text-xs text-upper">KEEP_ACTIVE</span>
              </label>
              {/* LOST_KEY: stub link — password reset not implemented in backend */}
              <button type="button" className="auth-link font-mono text-xs text-upper">
                LOST_KEY?
              </button>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="btn btn-primary btn-full"
              style={{ marginTop: 24 }}
              disabled={loading}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 14, height: 14 }} /> AUTHENTICATING...</>
              ) : (
                'LOG IN →'
              )}
            </button>
          </form>

          <p className="auth-footer-link font-mono text-xs">
            Don&apos;t have an account?{' '}
            <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>

      <div className="auth-sys-info" aria-hidden="true">
        <span className="console-line">SYS.INIT();</span>
        <span className="console-line">AWAITING_INPUT...</span>
      </div>
    </div>
  );
};

export default Login;
