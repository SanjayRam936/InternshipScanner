import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register as apiRegister } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const getStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 'WEAK', pct: 33, color: 'var(--accent)' };
  if (score <= 3) return { level: 'FAIR', pct: 66, color: 'var(--warning)' };
  return { level: 'STRONG', pct: 100, color: 'var(--success)' };
};

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = getStrength(form.password);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('SEC_KEY mismatch: passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await apiRegister(form.username, form.email, form.password);
      // Auto-login on success
      await login(form.username, form.password, false);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.username?.[0] || data?.email?.[0] ||
        data?.password?.[0] || data?.detail || 'Registration failed.';
      setError(msg);
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
            <h1 className="auth-wordmark" style={{ fontSize: 22 }}>SYSTEM REGISTRATION</h1>
            <span className="tag tag-muted">SYS_VER_1.4.2</span>
          </div>

          {error && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form id="register-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-fields">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-username">
                  USR_ID <span style={{ color: 'var(--text-muted)' }}>[Username]</span>
                </label>
                <input id="reg-username" className="form-input" type="text"
                  placeholder="choose_username" value={form.username}
                  onChange={set('username')} autoComplete="username" required />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">
                  EML_ADDR <span style={{ color: 'var(--text-muted)' }}>[Email]</span>
                </label>
                <input id="reg-email" className="form-input" type="email"
                  placeholder="user@domain.com" value={form.email}
                  onChange={set('email')} autoComplete="email" required />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">
                  SEC_KEY <span style={{ color: 'var(--text-muted)' }}>[Password]</span>
                </label>
                <input id="reg-password" className="form-input" type="password"
                  placeholder="min. 8 characters" value={form.password}
                  onChange={set('password')} autoComplete="new-password" required />
                {form.password && (
                  <div className="strength-meter">
                    <div className="strength-bar">
                      <div
                        className="strength-fill"
                        style={{ width: `${strength.pct}%`, background: strength.color }}
                      />
                    </div>
                    <span className="font-mono text-xs" style={{ color: strength.color }}>
                      {strength.level}
                    </span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-confirm">
                  VFY_KEY <span style={{ color: 'var(--text-muted)' }}>[Confirm]</span>
                </label>
                <input id="reg-confirm" className="form-input" type="password"
                  placeholder="repeat password" value={form.confirm}
                  onChange={set('confirm')} autoComplete="new-password" required />
                {form.confirm && form.password !== form.confirm && (
                  <p className="form-error">⚠ Keys do not match</p>
                )}
              </div>
            </div>

            <button id="register-submit-btn" type="submit" className="btn btn-primary btn-full"
              style={{ marginTop: 24 }} disabled={loading}>
              {loading ? (
                <><div className="spinner" style={{ width: 14, height: 14 }} /> REGISTERING...</>
              ) : (
                'CREATE ACCOUNT →'
              )}
            </button>
          </form>

          <p className="auth-footer-link font-mono text-xs">
            Already have an account?{' '}
            <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
