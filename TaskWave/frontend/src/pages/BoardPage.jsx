import '../styles/board.css';
import TaskForm from '../components/TaskForm';
import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import LogPanel from '../components/LogPanel';
import ConflictModal from '../components/ConflictModal';
import Header from '../components/Header';
import Toast from '../components/Toast';

const COLUMN_NAMES = ['Todo', 'In Progress', 'Done'];

function BoardPage() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [editTask, setEditTask] = useState(null);
  const socketRef = useRef(null);
  const draggedTaskId = useRef(null);
  const [conflict, setConflict] = useState(null); // { serverTask, clientTask }
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/tasks');
        setTasks(res.data);
      } catch (err) {
        setError('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/auth/users');
        setUsers(res.data);
      } catch {}
    };
    fetchUsers();
  }, []);

  // Real-time updates with Socket.IO
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    socketRef.current = socket;
    socket.on('taskCreated', (task) => {
      setTasks(prev => prev.some(t => t._id === task._id) ? prev : [...prev, task]);
    });
    socket.on('taskUpdated', (task) => {
      setTasks(prev => prev.map(t => t._id === task._id ? task : t));
    });
    socket.on('taskDeleted', ({ _id }) => {
      setTasks(prev => prev.filter(t => t._id !== _id));
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleAddTask = async (data) => {
    try {
      console.log('handleAddTask called with data:', data);
      const res = await api.post('/tasks', {
        ...data,
        assignedTo: data.assignedTo || user.id,
        status: data.status || 'Todo',
        priority: data.priority || 'Medium',
      });
      console.log('Task created successfully:', res.data);
      setShowTaskForm(false);
    } catch (err) {
      console.error('Error creating task:', err);
      alert(err.response?.data?.message || 'Failed to add task');
    }
  };

  const handleEditTask = (task) => {
    setEditTask(task);
    setShowTaskForm(true);
  };

  const handleUpdateTask = async (data) => {
    try {
      await api.put(`/tasks/${editTask._id}`, {
        ...data,
        assignedTo: data.assignedTo || user.id,
        status: data.status || 'Todo',
        priority: data.priority || 'Medium',
        updatedAt: editTask.updatedAt, // Ensure conflict detection works
      });
      setShowTaskForm(false);
      setEditTask(null);
    } catch (err) {
      if (err.response?.status === 409) {
        setConflict({
          serverTask: err.response.data.serverTask,
          clientTask: { ...editTask, ...data },
        });
      } else {
        alert(err.response?.data?.message || 'Failed to update task');
      }
    }
  };

  const handleMerge = () => {
    setShowTaskForm(true);
    setEditTask(conflict.clientTask);
    setConflict(null);
  };

  const handleOverwrite = async () => {
    try {
      await api.put(`/tasks/${editTask._id}/resolve`, {
        ...conflict.clientTask,
        assignedTo: conflict.clientTask.assignedTo || user.id,
        status: conflict.clientTask.status || 'Todo',
        priority: conflict.clientTask.priority || 'Medium',
      });
      setShowTaskForm(false);
      setEditTask(null);
      setConflict(null);
    } catch (err) {
      alert('Failed to overwrite task');
    }
  };

  const handleCloseConflict = () => {
    setConflict(null);
  };

  const handleDeleteTask = async () => {
    if (!editTask) return;
    try {
      await api.delete(`/tasks/${editTask._id}`);
      setShowTaskForm(false);
      setEditTask(null);
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  const handleCloseForm = () => {
    setShowTaskForm(false);
    setEditTask(null);
  };

  const handleSmartAssign = async () => {
    if (!editTask) return;
    try {
      const res = await api.post(`/tasks/${editTask._id}/smart-assign`);
      setShowTaskForm(false);
      setEditTask(null);
      setToast({ message: `Smart Assigned to ${res.data.task.assignedTo?.username || 'a user'}`, type: 'success' });
    } catch (err) {
      setToast({ message: 'Smart Assign failed', type: 'error' });
    }
  };

  // Drag-and-drop handlers
  const onDragStart = (e, taskId) => {
    draggedTaskId.current = taskId;
    setDraggingTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e, col) => {
    e.preventDefault();
    setDragOverCol(col);
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = async (e, newStatus) => {
    e.preventDefault();
    const taskId = draggedTaskId.current;
    setDragOverCol(null);
    setDraggingTaskId(null);
    const task = tasks.find(t => t._id === taskId);
    if (task && task.status !== newStatus) {
      try {
        await api.put(`/tasks/${taskId}`, { ...task, status: newStatus });
        // Real-time update will sync the board
      } catch (err) {
        alert('Failed to move task');
      }
    }
    draggedTaskId.current = null;
  };

  return (
    <div className="board-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Header user={user} onLogout={logout} />
      {error && <div className="board-error">{error}</div>}
      <div style={{textAlign: 'center', marginBottom: '1.5rem'}}>
        <button className="add-task-btn" onClick={() => { 
          console.log('Add Task button clicked');
          setShowTaskForm(true); 
          setEditTask(null); 
        }}>
          <span className="plus-icon">+</span>
          Add Task
        </button>
      </div>
      <div className="kanban-board">
        {COLUMN_NAMES.map((col) => {
          const taskCount = tasks.filter(t => t.status === col).length;
          return (
            <div
              className={`kanban-column${dragOverCol === col ? ' drag-over' : ''}`}
              key={col}
              onDragOver={e => onDragOver(e, col)}
              onDrop={e => onDrop(e, col)}
            >
              <div className="column-header">
                <h2>{col}</h2>
                <span className="task-count-badge">{taskCount}</span>
              </div>
              <div className="kanban-tasks">
                {tasks.filter(t => t.status === col).map(task => (
                  <div
                    className={`kanban-task${draggingTaskId === task._id ? ' dragging' : ''}`}
                    key={task._id}
                    onClick={() => handleEditTask(task)}
                    style={{cursor: 'pointer'}}
                    draggable
                    onDragStart={e => onDragStart(e, task._id)}
                  >
                    <div className="task-title">{task.title}</div>
                    <div className="task-desc">{task.description}</div>
                    <div className="task-meta">
                      <span>Assigned: {task.assignedTo?.username || 'Unassigned'}</span>
                      <div className={`priority-badge priority-${task.priority?.toLowerCase()}`}>
                        <div className="priority-indicator"></div>
                        Priority: {task.priority}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <LogPanel />
      {showTaskForm && (
        <TaskForm
          onSubmit={editTask ? handleUpdateTask : handleAddTask}
          onClose={handleCloseForm}
          initialData={editTask}
          users={users}
          onDelete={editTask ? handleDeleteTask : undefined}
          onSmartAssign={editTask ? handleSmartAssign : undefined}
        />
      )}
      {conflict && (
        <ConflictModal
          serverTask={conflict.serverTask}
          clientTask={conflict.clientTask}
          onMerge={handleMerge}
          onOverwrite={handleOverwrite}
          onClose={handleCloseConflict}
        />
      )}
    </div>
  );
}

export default BoardPage; 