import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.hash = '#login';
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        backgroundColor: 'var(--bg-primary, #f8fafc)',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="loader-spinner" style={{ 
          width: '36px', 
          height: '36px', 
          border: '3px solid rgba(16, 185, 129, 0.15)', 
          borderTopColor: '#10b981', 
          borderRadius: '50%', 
          animation: 'spin-loader 0.8s linear infinite' 
        }}></div>
        <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>Loading workspace...</span>
        <style>{`
          @keyframes spin-loader {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return children;
}
