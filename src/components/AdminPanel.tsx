import { useEffect, useState } from 'react';
import { supabase, type User } from '../lib/supabase';
import { ChevronDown, Plus, Trash2, Edit2, LogOut, Users, Film, Radio } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  organization_id: string;
  is_admin: boolean;
}

interface Channel {
  id: string;
  name: string;
  stream_url: string;
  category: string;
  credits_cost: number;
}

interface ContentItem {
  id: string;
  title: string;
  type: string;
  category: string;
  credits_cost: number;
}

export function AdminPanel({ user, onBack }: { user: User; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'users' | 'channels' | 'content'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const { data } = await supabase.from('users').select('*');
        setUsers(data || []);
      } else if (activeTab === 'channels') {
        const { data } = await supabase.from('channels').select('*');
        setChannels(data || []);
      } else {
        const { data } = await supabase.from('content').select('*');
        setContent(data || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este usuário?')) {
      await supabase.from('users').delete().eq('id', id);
      loadData();
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este canal?')) {
      await supabase.from('channels').delete().eq('id', id);
      loadData();
    }
  };

  const handleDeleteContent = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este conteúdo?')) {
      await supabase.from('content').delete().eq('id', id);
      loadData();
    }
  };

  const handleAddChannel = async () => {
    if (editingId) {
      await supabase
        .from('channels')
        .update({
          name: formData.name,
          stream_url: formData.stream_url,
          category: formData.category,
          credits_cost: formData.credits_cost || 0
        })
        .eq('id', editingId);
      setEditingId(null);
    } else {
      await supabase.from('channels').insert([
        {
          organization_id: user.organization_id,
          name: formData.name,
          stream_url: formData.stream_url,
          category: formData.category,
          credits_cost: formData.credits_cost || 0
        }
      ]);
    }
    setFormData({});
    setShowForm(false);
    loadData();
  };

  const handleAddContent = async () => {
    if (editingId) {
      await supabase
        .from('content')
        .update({
          title: formData.title,
          type: formData.type,
          description: formData.description,
          category: formData.category,
          credits_cost: formData.credits_cost || 0
        })
        .eq('id', editingId);
      setEditingId(null);
    } else {
      await supabase.from('content').insert([
        {
          organization_id: user.organization_id,
          title: formData.title,
          type: formData.type,
          description: formData.description,
          category: formData.category,
          credits_cost: formData.credits_cost || 0
        }
      ]);
    }
    setFormData({});
    setShowForm(false);
    loadData();
  };

  const handleEditChannel = (channel: Channel) => {
    setFormData(channel);
    setEditingId(channel.id);
    setShowForm(true);
  };

  const handleEditContent = (item: ContentItem) => {
    setFormData(item);
    setEditingId(item.id);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Painel Admin</h1>
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            Voltar
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 flex gap-8">
          {['users', 'channels', 'content'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 px-2 font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === tab
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'users' && <Users className="w-5 h-5" />}
              {tab === 'channels' && <Radio className="w-5 h-5" />}
              {tab === 'content' && <Film className="w-5 h-5" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">Usuários</h2>
            {loading ? (
              <p className="text-gray-400">Carregando...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-gray-800">
                    <tr>
                      <th className="pb-4 text-sm font-semibold text-gray-300">Email</th>
                      <th className="pb-4 text-sm font-semibold text-gray-300">Nome</th>
                      <th className="pb-4 text-sm font-semibold text-gray-300">Admin</th>
                      <th className="pb-4 text-sm font-semibold text-gray-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-900/50 transition">
                        <td className="py-4">{u.email}</td>
                        <td className="py-4">{u.full_name}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            u.is_admin ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-400'
                          }`}>
                            {u.is_admin ? 'Admin' : 'Usuário'}
                          </span>
                        </td>
                        <td className="py-4">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-500 hover:text-red-400 transition"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Channels Tab */}
        {activeTab === 'channels' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Canais</h2>
              <button
                onClick={() => {
                  setFormData({});
                  setEditingId(null);
                  setShowForm(!showForm);
                }}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg transition font-semibold"
              >
                <Plus className="w-5 h-5" />
                Novo Canal
              </button>
            </div>

            {showForm && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6 space-y-4">
                <input
                  type="text"
                  placeholder="Nome do canal"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <input
                  type="url"
                  placeholder="URL da stream"
                  value={formData.stream_url || ''}
                  onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <input
                  type="text"
                  placeholder="Categoria"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <input
                  type="number"
                  placeholder="Custo em créditos"
                  value={formData.credits_cost || ''}
                  onChange={(e) => setFormData({ ...formData, credits_cost: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleAddChannel}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg transition font-semibold"
                  >
                    {editingId ? 'Atualizar' : 'Criar'}
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setFormData({});
                      setEditingId(null);
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <p className="text-gray-400">Carregando...</p>
            ) : (
              <div className="grid gap-4">
                {channels.map((channel) => (
                  <div key={channel.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{channel.name}</h3>
                      <p className="text-sm text-gray-400">{channel.category}</p>
                      <p className="text-xs text-gray-500 mt-2">{channel.stream_url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditChannel(channel)}
                        className="text-blue-400 hover:text-blue-300 transition p-2"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteChannel(channel.id)}
                        className="text-red-500 hover:text-red-400 transition p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Conteúdo</h2>
              <button
                onClick={() => {
                  setFormData({});
                  setEditingId(null);
                  setShowForm(!showForm);
                }}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg transition font-semibold"
              >
                <Plus className="w-5 h-5" />
                Novo Conteúdo
              </button>
            </div>

            {showForm && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6 space-y-4">
                <input
                  type="text"
                  placeholder="Título"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <select
                  value={formData.type || 'movie'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="movie">Filme</option>
                  <option value="series">Série</option>
                  <option value="episode">Episódio</option>
                </select>
                <textarea
                  placeholder="Descrição"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  rows={3}
                />
                <input
                  type="text"
                  placeholder="Categoria"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <input
                  type="number"
                  placeholder="Custo em créditos"
                  value={formData.credits_cost || ''}
                  onChange={(e) => setFormData({ ...formData, credits_cost: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleAddContent}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg transition font-semibold"
                  >
                    {editingId ? 'Atualizar' : 'Criar'}
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setFormData({});
                      setEditingId(null);
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <p className="text-gray-400">Carregando...</p>
            ) : (
              <div className="grid gap-4">
                {content.map((item) => (
                  <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <p className="text-sm text-gray-400">{item.type} • {item.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditContent(item)}
                        className="text-blue-400 hover:text-blue-300 transition p-2"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContent(item.id)}
                        className="text-red-500 hover:text-red-400 transition p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
