import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { io } from 'socket.io-client';
import './LogPanel.css';

function formatTime(ts) {
  return new Date(ts).toLocaleString();
}

const ACTION_LABELS = {
  create: { label: 'created', icon: '🟢', color: '#27ae60' },
  update: { label: 'updated', icon: '🟡', color: '#f39c12' },
  delete: { label: 'deleted', icon: '🔴', color: '#e74c3c' },
  smart_assign: { label: 'smart assigned', icon: '🤖', color: '#4f8cff' },
  resolve_conflict: { label: 'resolved conflict', icon: '⚡', color: '#6a82fb' },
};

function LogPanel() {
  const [logs, setLogs] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/logs');
        setLogs(res.data);
      } catch {}
    };
    fetchLogs();
  }, []);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    socketRef.current = socket;
    socket.on('logCreated', (log) => {
      setLogs(prev => [log, ...prev].slice(0, 20));
    });
    return () => socket.disconnect();
  }, []);

  return (
    <div className="floating-log-panel">
      <h3>Activity Log</h3>
      <div className="log-list">
        {logs.map(log => {
          const action = ACTION_LABELS[log.action] || { label: log.action, icon: '📝', color: '#4f8cff' };
          return (
            <div key={log._id} className="log-card">
              <div className="log-card-header">
                <div className="log-icon" style={{ color: action.color }}>
                  {action.icon}
                </div>
                <div className="log-content">
                  <div className="log-main-line">
                    <span className="log-user">{log.user?.username || 'Someone'}</span>
                    <span className="log-action">{action.label}</span>
                    <span className="log-task">{log.task?.title ? <b>"{log.task.title}"</b> : 'a task'}</span>
                  </div>
                  <div className="log-time">{formatTime(log.timestamp)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LogPanel; 