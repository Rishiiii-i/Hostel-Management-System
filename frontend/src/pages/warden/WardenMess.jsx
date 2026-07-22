import { useState, useEffect } from 'react'
import Icon from '../../components/Icon'

export default function WardenMess() {
  const [messMenu, setMessMenu] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState('')
  const [editForm, setEditForm] = useState({
    breakfast: '',
    lunch: '',
    snacks: '',
    dinner: ''
  })

  // Helper for requests with auth token
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };
    return fetch(url, { ...options, headers });
  };

  const loadMessData = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/warden/mess/menu');
      if (res.ok) {
        const data = await res.json();
        // Sort days from Monday to Sunday
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const sorted = data.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
        setMessMenu(sorted);
      }
    } catch (err) {
      console.error('Failed to load mess menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessData();
  }, []);

  const handleEditClick = (item) => {
    setSelectedDay(item.day);
    setEditForm({
      breakfast: item.breakfast,
      lunch: item.lunch,
      snacks: item.snacks,
      dinner: item.dinner
    });
    setShowModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth(`http://localhost:5000/api/warden/mess/menu/${selectedDay}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        alert('Mess menu successfully updated');
        setShowModal(false);
        loadMessData();
      } else {
        alert('Failed to update mess menu.');
      }
    } catch (err) {
      console.error('Failed to update mess menu:', err);
    }
  };

  return (
    <div className="tab-pane animate-fade-in-slide-up">
      {/* Header Bar */}
      <div className="owner-card-box" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif', color: '#0f172a' }}>Mess Menu Management</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Configure weekly breakfast, lunch, snacks, and dinner schedules</span>
          </div>
        </div>
      </div>

      {/* Mess Table */}
      <div className="owner-table-wrapper">
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', fontWeight: 600, color: '#475569' }}>
            Loading mess menu...
          </div>
        ) : messMenu.length === 0 ? (
          <p className="empty-state-text" style={{ padding: '36px 0', textAlign: 'center', margin: 0 }}>
            No mess menu configurations found in database.
          </p>
        ) : (
          <table className="owner-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Breakfast</th>
                <th>Lunch</th>
                <th>Snacks</th>
                <th>Dinner</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {messMenu.map((item) => (
                <tr key={item.day}>
                  <td><strong>{item.day}</strong></td>
                  <td>{item.breakfast}</td>
                  <td>{item.lunch}</td>
                  <td>{item.snacks}</td>
                  <td>{item.dinner}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-purple-primary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => handleEditClick(item)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Menu Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div className="owner-card-box" style={{ maxWidth: '450px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, font: '800 18px "Manrope", sans-serif' }}>Edit Menu: {selectedDay}</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Breakfast</label>
                <input
                  type="text"
                  value={editForm.breakfast}
                  onChange={(e) => setEditForm({ ...editForm, breakfast: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Lunch</label>
                <input
                  type="text"
                  value={editForm.lunch}
                  onChange={(e) => setEditForm({ ...editForm, lunch: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Snacks</label>
                <input
                  type="text"
                  value={editForm.snacks}
                  onChange={(e) => setEditForm({ ...editForm, snacks: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Dinner</label>
                <input
                  type="text"
                  value={editForm.dinner}
                  onChange={(e) => setEditForm({ ...editForm, dinner: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="owner-refresh-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-purple-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
