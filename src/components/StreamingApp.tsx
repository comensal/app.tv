import { useEffect, useState } from 'react';
import { supabase, type User } from '../lib/supabase';
import { Search, LogOut, Settings, Play, Users, Zap } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  logo_url: string;
  category: string;
  credits_cost: number;
}

interface Content {
  id: string;
  title: string;
  type: string;
  poster_url: string;
  category: string;
  credits_cost: number;
}

interface Subscription {
  id: string;
  current_credits: number;
}

export function StreamingApp({ user, onSignOut, onAdmin }: { user: User; onSignOut: () => void; onAdmin: () => void }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [selectedTab, setSelectedTab] = useState<'channels' | 'movies' | 'series'>('channels');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch subscription
      const { data: sub } = await supabase
        .from('user_subscriptions')
        .select('id, current_credits')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      setSubscription(sub);

      // Fetch channels
      const { data: chans } = await supabase
        .from('channels')
        .select('id, name, logo_url, category, credits_cost')
        .eq('is_active', true)
        .order('display_order');

      setChannels(chans || []);

      // Fetch content
      const { data: cont } = await supabase
        .from('content')
        .select('id, title, type, poster_url, category, credits_cost')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setContent(cont || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWatchChannel = async (channel: Channel) => {
    if (subscription && subscription.current_credits >= channel.credits_cost) {
      // Record watch history
      await supabase.from('watch_history').insert([
        {
          user_id: user.id,
          channel_id: channel.id,
          credits_spent: channel.credits_cost
        }
      ]);

      // Deduct credits
      await supabase
        .from('user_subscriptions')
        .update({
          current_credits: subscription.current_credits - channel.credits_cost,
          monthly_credits_used: (subscription.id || 0) + channel.credits_cost
        })
        .eq('id', subscription.id);

      setSubscription({ ...subscription, current_credits: subscription.current_credits - channel.credits_cost });
      window.open(channels.find(c => c.id === channel.id)?.logo_url, '_blank');
    }
  };

  const handleWatchContent = async (content: Content) => {
    if (subscription && subscription.current_credits >= content.credits_cost) {
      // Record watch history
      await supabase.from('watch_history').insert([
        {
          user_id: user.id,
          content_id: content.id,
          credits_spent: content.credits_cost
        }
      ]);

      // Deduct credits
      await supabase
        .from('user_subscriptions')
        .update({
          current_credits: subscription.current_credits - content.credits_cost
        })
        .eq('id', subscription.id);

      setSubscription({ ...subscription, current_credits: subscription.current_credits - content.credits_cost });
    }
  };

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContent = content.filter(c =>
    selectedTab === 'movies' ? c.type === 'movie' :
    selectedTab === 'series' ? c.type === 'series' :
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gradient-to-b from-black via-gray-900 to-transparent border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Play className="w-6 h-6 fill-white" />
              </div>
              <h1 className="text-2xl font-bold">StreamHub</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="font-semibold">{subscription?.current_credits || 0}</span>
              </div>
              {user.is_admin && (
                <button
                  onClick={onAdmin}
                  title="Painel Admin"
                  className="p-2 hover:bg-gray-800 rounded-lg transition"
                >
                  <Settings className="w-6 h-6" />
                </button>
              )}
              <button
                onClick={onSignOut}
                className="p-2 hover:bg-gray-800 rounded-lg transition"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar canais e conteúdo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            {(['channels', 'movies', 'series'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`py-4 px-2 font-semibold border-b-2 transition ${
                  selectedTab === tab
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {selectedTab === 'channels' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleWatchChannel(channel)}
                className="group relative rounded-lg overflow-hidden bg-gray-800 hover:bg-gray-700 transition"
              >
                <div className="aspect-square bg-gray-900 flex items-center justify-center">
                  {channel.logo_url ? (
                    <img src={channel.logo_url} alt={channel.name} className="w-3/4 h-3/4 object-contain" />
                  ) : (
                    <div className="text-center">
                      <Play className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
                      <p className="text-xs font-semibold">{channel.name}</p>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <div className="text-center">
                    <p className="font-bold mb-2">{channel.name}</p>
                    {channel.credits_cost > 0 && (
                      <div className="flex items-center justify-center gap-1 text-yellow-400">
                        <Zap className="w-4 h-4" />
                        {channel.credits_cost}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredContent.map((item) => (
              <button
                key={item.id}
                onClick={() => handleWatchContent(item)}
                className="group relative rounded-lg overflow-hidden"
              >
                <div className="aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden">
                  {item.poster_url ? (
                    <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                      <Play className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition rounded-lg flex flex-col items-center justify-center p-2">
                  <Play className="w-10 h-10 text-cyan-400 mb-2 fill-cyan-400" />
                  <p className="text-xs font-bold text-center line-clamp-2 mb-2">{item.title}</p>
                  {item.credits_cost > 0 && (
                    <div className="flex items-center gap-1 text-yellow-400 text-xs">
                      <Zap className="w-3 h-3" />
                      {item.credits_cost}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
