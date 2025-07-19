import { useState } from 'react';

const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['Todo', 'In Progress', 'Done'];

function TaskForm({ onSubmit, onClose, initialData, users = [], onDelete, onSmartAssign }) {
  initialData = initialData || {};
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [priority, setPriority] = useState(initialData.priority || 'Medium');
  const [status, setStatus] = useState(initialData.status || 'Todo');
  const [assignedTo, setAssignedTo] = useState(initialData.assignedTo?._id || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (['Todo', 'In Progress', 'Done'].includes(title.trim())) {
      setError('Title cannot match column names');
      return;
    }
    onSubmit({
      title: title.trim(),
      description,
      priority,
      status,
      assignedTo,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modern-modal modal-animate" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
        <h3 id="task-modal-title">{initialData._id ? 'Edit Task' : 'Add Task'}</h3>
        <form className="task-form" onSubmit={handleSubmit} autoComplete="off">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            autoFocus
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
          />
          <div className="form-row">
            <select className={`priority-select priority-${priority.toLowerCase()}`} value={priority} onChange={e => setPriority(e.target.value)}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className={`status-select status-${status.replace(/\s/g, '').toLowerCase()}`} value={status} onChange={e => setStatus(e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
              <option value="">Unassigned</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.username}</option>)}
            </select>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button type="submit" className="primary-btn">{initialData._id ? 'Save' : 'Add'}</button>
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
            {initialData._id && (
              <>
                <button
                  type="button"
                  className="delete-btn"
                  style={{ background: '#e74c3c', color: '#fff', marginLeft: 'auto' }}
                  onClick={() => {
                    if (window.confirm('Delete this task?')) onDelete();
                  }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="smart-assign-btn"
                  style={{ background: 'linear-gradient(90deg, #4f8cff 60%, #6a82fb 100%)', color: '#fff' }}
                  onClick={onSmartAssign}
                  title="Assigns this task to the user with the fewest non-Done tasks. Ensures fair workload distribution."
                >
                  Smart Assign
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskForm; 