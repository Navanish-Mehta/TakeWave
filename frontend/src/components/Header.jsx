import React from 'react';
import './Header.css';

function Header({ user, onLogout }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <span className="app-logo">📝</span>
        <span className="app-title">TaskWave</span>
      </div>
      <div className="header-right">
        <span className="user-info">{user ? `Welcome, ${user.username}` : ''}</span>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}

export default Header; 