'use client';

import { useState, useEffect, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { createClient } from '@/lib/db/client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import { Send, LayoutDashboard, ListChecks, Settings, User as UserIcon, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function AgentCore({ status }: { status: 'idle' | 'thinking' | 'success' | 'error' }) {
  const color = {
    idle: '#3b82f6',
    thinking: '#a855f7',
    success: '#22c55e',
    error: '#ef4444',
  }[status];

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
      <Sphere args={[1, 64, 64]}>
        <MeshDistortMaterial
          color={color}
          speed={status === 'thinking' ? 4 : 1}
          distort={status === 'thinking' ? 0.6 : 0.3}
          radius={1}
        />
      </Sphere>
    </Float>
  );
}

function extractTextContent(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(extractTextContent).join('');
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.text === 'string') return obj.text;
    if ('content' in obj) return extractTextContent(obj.content);
    if ('parts' in obj) return extractTextContent(obj.parts);
    if ('value' in obj && typeof obj.value === 'string') return obj.value;
  }
  return '';
}

export default function WorkspacePage() {
  const [userName, setUserName] = useState('Guest');
  const [tasks, setTasks] = useState<Array<{ status: string }>>([]);
  const [input, setInput] = useState('');
  const supabase = createClient();
  const router = useRouter();

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/agent' }),
  });

  const fetchTasks = useCallback(
    async (uid: string) => {
      const { data } = await supabase
        .from('tasks')
        .select('id, label, status, created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (data) setTasks(data);
    },
    [supabase],
  );

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/signin');
        return;
      }

      const metadata = user.user_metadata as { full_name?: string; name?: string } | undefined;
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      setUserName(profile?.full_name || metadata?.full_name || metadata?.name || user.email?.split('@')[0] || 'Guest');
      await fetchTasks(user.id);
    }
    void init();
  }, [fetchTasks, router, supabase]);

  const isLoading = status === 'streaming' || status === 'submitted';
  const lastMessage = messages[messages.length - 1];
  const lastMessageText = lastMessage ? extractTextContent(lastMessage) : '';

  const agentStatus = isLoading
    ? 'thinking'
    : lastMessageText.toLowerCase().includes('error')
      ? 'error'
      : 'idle';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || status !== 'ready') return;

    const value = input.trim();
    setInput('');
    await sendMessage({ text: value });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <aside className="w-64 border-r border-zinc-800 flex flex-col bg-zinc-900/50 backdrop-blur-xl">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tighter text-white flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            Orbit AI
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium transition">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white text-sm transition">
            <ListChecks size={18} /> Task History
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white text-sm transition">
            <Settings size={18} /> Settings
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-800/50">
            <UserIcon size={18} className="text-zinc-400" />
            <span className="text-xs font-medium truncate">{userName}</span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-zinc-500 font-bold">Active Tasks</span>
              <span className="text-sm font-mono text-white">{tasks.filter((task) => task.status === 'running').length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-zinc-500 font-bold">Success Rate</span>
              <span className="text-sm font-mono text-white">
                {tasks.length > 0
                  ? Math.round((tasks.filter((task) => task.status === 'completed').length / tasks.length) * 100)
                  : 0}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-zinc-400">Welcome back,</p>
              <p className="text-sm font-medium text-white">{userName}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
          </div>
        </header>

        <div className="flex-1 flex relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 5] }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
              <AgentCore status={agentStatus} />
              <OrbitControls enableZoom={false} enablePan={false} />
            </Canvas>
          </div>

          <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col h-full p-6 pointer-events-none">
            <div className="flex-1 overflow-y-auto space-y-4 mb-6 pointer-events-auto scrollbar-hide">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                  <div className="p-4 rounded-full bg-zinc-800 border border-zinc-700">
                    <LayoutDashboard size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Ready for operations</h3>
                    <p className="text-sm text-zinc-400 max-w-xs">
                      Ask me to check inventory, send alerts, or calculate shipping.
                    </p>
                  </div>
                </div>
              )}
              {messages.map((message) => {
                const text = extractTextContent(message);
                return (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-zinc-800/80 backdrop-blur-md border border-zinc-700 text-zinc-200 rounded-tl-none'
                    }`}>
                      {text}
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800/80 backdrop-blur-md border border-zinc-700 px-4 py-3 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="relative pointer-events-auto group"
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Enter operation command..."
                className="w-full pl-5 pr-14 py-4 bg-zinc-900/80 backdrop-blur-xl border border-zinc-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-500"
              />
              <button
                type="submit"
                disabled={!input || isLoading}
                className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl transition-all"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
