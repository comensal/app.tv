import { useState } from 'react';
import { Loader } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { Auth } from './components/Auth';
import { StreamingApp } from './components/StreamingApp';
import { AdminPanel } from './components/AdminPanel';

function App() {
  const { user, loading, signOut } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (showAdmin) {
    return <AdminPanel user={user} onBack={() => setShowAdmin(false)} />;
  }

  return (
    <StreamingApp
      user={user}
      onSignOut={signOut}
      onAdmin={() => setShowAdmin(true)}
    />
  );
}

export default App;
