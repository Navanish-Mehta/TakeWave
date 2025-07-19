import React from 'react';
import './ConflictModal.css';

function highlightDiff(val1, val2) {
  return val1 !== val2 ? { background: '#fffbe6', fontWeight: 600 } : {};
}

function ConflictModal({ serverTask, clientTask, onMerge, onOverwrite, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modern-modal conflict-modal-animate" role="dialog" aria-modal="true" aria-labelledby="conflict-modal-title">
        <h3 id="conflict-modal-title">Conflict Detected</h3>
        <p style={{marginBottom: '1.2rem'}}>This task was updated by someone else. Review both versions and choose how to resolve:</p>
        <div className="conflict-diff">
          <div className="conflict-version">
            <h4>Server Version</h4>
            <div style={highlightDiff(serverTask.title, clientTask.title)}><b>Title:</b> {serverTask.title}</div>
            <div style={highlightDiff(serverTask.description, clientTask.description)}><b>Description:</b> {serverTask.description}</div>
            <div style={highlightDiff(serverTask.status, clientTask.status)}><b>Status:</b> {serverTask.status}</div>
            <div style={highlightDiff(serverTask.priority, clientTask.priority)}><b>Priority:</b> {serverTask.priority}</div>
            <div style={highlightDiff(serverTask.assignedTo, clientTask.assignedTo)}><b>Assigned:</b> {serverTask.assignedTo?.username || 'Unassigned'}</div>
          </div>
          <div className="conflict-version">
            <h4>Your Version</h4>
            <div style={highlightDiff(clientTask.title, serverTask.title)}><b>Title:</b> {clientTask.title}</div>
            <div style={highlightDiff(clientTask.description, serverTask.description)}><b>Description:</b> {clientTask.description}</div>
            <div style={highlightDiff(clientTask.status, serverTask.status)}><b>Status:</b> {clientTask.status}</div>
            <div style={highlightDiff(clientTask.priority, serverTask.priority)}><b>Priority:</b> {clientTask.priority}</div>
            <div style={highlightDiff(clientTask.assignedTo, serverTask.assignedTo)}><b>Assigned:</b> {clientTask.assignedTo?.username || 'Unassigned'}</div>
          </div>
        </div>
        <div className="conflict-actions">
          <button className="primary-btn" onClick={onMerge}>Merge</button>
          <button className="primary-btn" style={{background:'#e74c3c', color:'#fff'}} onClick={onOverwrite}>Overwrite</button>
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default ConflictModal; 