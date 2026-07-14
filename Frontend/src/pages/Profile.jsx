import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateCurrentUser, changePassword } from '../api/authApi';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);

  const setP = (k) => (e) => setProfileForm((f) => ({ ...f, [k]: e.target.value }));
  const setPw = (k) => (e) => setPwForm((f) => ({ ...f, [k]: e.target.value }));

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(''); setProfileError(''); setProfileLoading(true);
    try {
      const { data } = await updateCurrentUser({
        username: profileForm.username,
        email: profileForm.email,
      });
      updateUser(data);
      setProfileMsg('REGISTRY_UPDATED — Changes saved.');
    } catch (err) {
      setProfileError(err.response?.data?.detail || 'Update failed.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg(''); setPwError('');
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError('Passwords do not match.'); return;
    }
    setPwLoading(true);
    try {
      await changePassword(pwForm.old_password, pwForm.new_password);
      setPwMsg('PASSWORD_ROTATED — New key active.');
      setPwForm({ old_password: '', new_password: '', confirm: '' });
      setShowPwForm(false);
    } catch (err) {
      setPwError(err.response?.data?.detail || err.response?.data?.old_password?.[0] || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  /* Avatar initials badge */
  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="page-container">
      <header className="topbar">
        <button id="profile-back-btn" className="topbar-icon-btn" onClick={() => navigate(-1)} aria-label="Back">←</button>
        <span className="topbar-brand">SCAN_PRO_V1</span>
        <button id="profile-logout-btn" className="btn btn-outline" style={{ fontSize: 11 }} onClick={logout}>
          LOGOUT →
        </button>
      </header>

      <div className="breadcrumb">
        Home / <span>Profile</span>
      </div>

      <main className="page-content">
        <h1 className="profile-heading">SYSTEM ACCOUNT</h1>

        <div className="profile-cards">
          {/* Left card: Profile Information */}
          <div className="profile-card bracket-box">
            <div className="bracket-box-inner">
              <div className="profile-card-header font-mono text-upper">
                Profile Information
              </div>

              <div className="profile-avatar" aria-label={`Avatar for ${user?.username}`}>
                {initials}
                {/* NOTE: No avatar upload endpoint in backend — static initials badge */}
              </div>

              {profileMsg && <div className="alert alert-success" style={{ marginBottom: 16 }}>{profileMsg}</div>}
              {profileError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{profileError}</div>}

              <form id="profile-update-form" onSubmit={handleUpdateProfile} noValidate>
                <div className="auth-fields">
                  <div className="form-group">
                    <label className="form-label" htmlFor="profile-username">OPERATOR NAME</label>
                    <input id="profile-username" className="form-input" type="text"
                      value={profileForm.username}
                      onChange={setP('username')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="profile-email">COMM LINK [Email]</label>
                    <input id="profile-email" className="form-input" type="email"
                      value={profileForm.email}
                      onChange={setP('email')} required />
                  </div>
                </div>
                <button id="profile-save-btn" type="submit" className="btn btn-primary btn-full"
                  style={{ marginTop: 20 }} disabled={profileLoading}>
                  {profileLoading ? 'SAVING...' : 'UPDATE REGISTRY →'}
                </button>
              </form>
            </div>
          </div>

          {/* Right card: Security Protocol */}
          <div className="profile-card bracket-box">
            <div className="bracket-box-inner">
              <div className="profile-card-header font-mono text-upper">
                Security Protocol
              </div>

              {/* 2FA toggle — no backend endpoint; cosmetic/non-functional */}
              <div className="profile-security-row">
                <div>
                  <p className="font-mono text-xs text-upper font-bold">AUTH FACTOR 2</p>
                  <p className="font-mono text-xs text-muted" style={{ marginTop: 4 }}>
                    [NOT_CONFIGURED] — 2FA endpoint not implemented
                  </p>
                </div>
                <div className="profile-toggle profile-toggle--disabled" aria-disabled="true"
                  title="2FA not available in this version">
                  <div className="profile-toggle-thumb" />
                </div>
              </div>

              <div className="profile-security-divider" />

              {pwMsg && <div className="alert alert-success" style={{ marginBottom: 16 }}>{pwMsg}</div>}
              {pwError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{pwError}</div>}

              {!showPwForm ? (
                <button id="show-change-password-btn" className="btn btn-outline btn-full"
                  onClick={() => setShowPwForm(true)}>
                  ↻ ROTATE PASSWORD
                </button>
              ) : (
                <form id="change-password-form" onSubmit={handleChangePassword} noValidate>
                  <div className="auth-fields">
                    <div className="form-group">
                      <label className="form-label" htmlFor="pw-old">CURRENT KEY</label>
                      <input id="pw-old" className="form-input" type="password"
                        value={pwForm.old_password} onChange={setPw('old_password')} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="pw-new">NEW KEY</label>
                      <input id="pw-new" className="form-input" type="password"
                        value={pwForm.new_password} onChange={setPw('new_password')} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="pw-confirm">CONFIRM NEW KEY</label>
                      <input id="pw-confirm" className="form-input" type="password"
                        value={pwForm.confirm} onChange={setPw('confirm')} required />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                    <button id="submit-change-password-btn" type="submit"
                      className="btn btn-primary" disabled={pwLoading}>
                      {pwLoading ? 'ROTATING...' : 'CONFIRM →'}
                    </button>
                    <button type="button" className="btn btn-outline"
                      onClick={() => { setShowPwForm(false); setPwError(''); setPwMsg(''); }}>
                      CANCEL
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
