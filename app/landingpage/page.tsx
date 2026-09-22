'use client';

import dynamic from 'next/dynamic';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import {
  Activity,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  FolderKanban,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings2,
  Sparkles,
  TerminalSquare,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/db/client';
import AttachMenu from '@/components/canvas/ui/Attachmenu';

const Viewpoint = dynamic(() => import('@/components/canvas/Viewpoint'), { ssr: false });
const DashboardScene = dynamic(() => import('@/components/canvas/scenes/Dashboard'), { ssr: false });

const suggestions = [
  { icon: '✦', label: 'Plan a project launch', prompt: 'Help me plan a project launch.' },
  { icon: '⌁', label: 'Analyze my data', prompt: 'Analyze the latest data and summarize the key insights.' },
  { icon: '◌', label: 'Draft a communication', prompt: 'Draft a clear update for my team.' },
];

type RecentTask = {
  id: string;
  title: string;
  time: string;
  status: string;
  tone: 'green' | 'amber';
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Unable to read attachment.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read attachment.'));
    reader.readAsDataURL(file);
  });
}

const supabase = createClient();

export default function AgentPage() {
  const [userName, setUserName] = useState('there');
  const [userId, setUserId] = useState<string | null>(null);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeNav, setActiveNav] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/agent' }),
  });
  const [input, setInput] = useState('');
  const isRunning = status === 'streaming' || status === 'submitted';
  const visibleTasks = recentTasks
    .filter((task) => task.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, showAllTasks ? undefined : 5);

  const handleNewTask = () => {
    setMessages([]);
    setInput('');
    setSelectedFile(null);
    setShowHistory(false);
    setActiveNav('Overview');
  };

  useEffect(() => {
    let mounted = true;

    const loadUserName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted || !user) return;

      setUserId(user.id);
      const metadata = user.user_metadata as { full_name?: string; name?: string } | undefined;
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      const displayName = profile?.full_name || metadata?.full_name || metadata?.name || user.email?.split('@')[0] || 'there';
      setUserName(displayName);

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, label, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Unable to load recent tasks:', error.message);
        return;
      }

      setRecentTasks(tasks.map((task) => ({
        id: task.id,
        title: task.label,
        time: new Date(task.created_at).toLocaleString(),
        status: task.status.charAt(0).toUpperCase() + task.status.slice(1),
        tone: task.status === 'completed' ? 'green' : 'amber',
      })));
    };

    loadUserName();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || status !== 'ready') return;

    const taskTitle = input.trim();
    let taskId: string | undefined;
    if (userId) {
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({ user_id: userId, label: taskTitle, status: 'pending' })
        .select('id, label, status, created_at')
        .single();

      if (error) {
        console.error('Unable to save task:', error.message);
      } else {
        taskId = task.id;
        setRecentTasks((tasks) => [
          {
            id: task.id,
            title: task.label,
            time: new Date(task.created_at).toLocaleString(),
            status: 'Pending',
            tone: 'amber' as const,
          },
          ...tasks,
        ].slice(0, 5));
      }
    }

    const files = selectedFile
      ? [{
          type: 'file' as const,
          mediaType: selectedFile.type || 'application/octet-stream',
          name: selectedFile.name,
          url: await readFileAsDataUrl(selectedFile),
        }]
      : undefined;

    sendMessage(
      { text: input, ...(files ? { files } : {}) },
      { body: { taskId } },
    );
    setSelectedFile(null);
    setInput('');
  };

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#172033]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[#e5eaf1] bg-[#fbfcfe] px-4 py-5 lg:flex">
          <div className="flex items-center gap-3 px-3">
            <div className="grid size-9 place-items-center rounded-xl bg-[#1d4ed8] text-white shadow-lg shadow-blue-200">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-[15px] font-bold tracking-tight">orbit<span className="text-[#2563eb]">.ai</span></p>
              <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#94a3b8]">Agent workspace</p>
            </div>
          </div>

          <button type="button" onClick={handleNewTask} className="mt-9 flex items-center justify-center gap-2 rounded-xl bg-[#172033] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-[#26344d]">
            <Plus size={16} /> New task
          </button>

          <nav className="mt-7 space-y-1">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#a1acbd]">Workspace</p>
            <NavItem icon={<LayoutDashboard size={17} />} label="Overview" active={activeNav === 'Overview'} onClick={() => setActiveNav('Overview')} />
            <NavItem icon={<FolderKanban size={17} />} label="All tasks" badge={String(recentTasks.length)} active={activeNav === 'All tasks'} onClick={() => { setActiveNav('All tasks'); setShowAllTasks(true); }} />
            <NavItem icon={<Activity size={17} />} label="Activity" active={activeNav === 'Activity'} onClick={() => setActiveNav('Activity')} />
            <NavItem icon={<Users size={17} />} label="Team" active={activeNav === 'Team'} onClick={() => setActiveNav('Team')} />
          </nav>

          <nav className="mt-8 space-y-1">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#a1acbd]">Resources</p>
            <NavItem icon={<FileText size={17} />} label="Knowledge base" active={activeNav === 'Knowledge base'} onClick={() => setActiveNav('Knowledge base')} />
            <NavItem icon={<TerminalSquare size={17} />} label="Integrations" active={activeNav === 'Integrations'} onClick={() => setActiveNav('Integrations')} />
          </nav>

          <div className="mt-auto rounded-2xl border border-[#e7ebf2] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-[#536176]"><Zap size={14} className="text-[#f59e0b]" /> Monthly usage</span>
              <span className="text-xs font-bold text-[#172033]">68%</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf1f6]"><div className="h-full w-[68%] rounded-full bg-[#2563eb]" /></div>
            <p className="mt-2 text-[11px] text-[#8c98aa]">1,360 of 2,000 actions used</p>
          </div>
          <div className="mt-4 flex items-center gap-3 border-t border-[#e5eaf1] px-2 pt-4">
            <div className="grid size-8 place-items-center rounded-full bg-[#dbeafe] text-xs font-bold text-[#1d4ed8]">AR</div>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{userName}</p><p className="text-[11px] text-[#8c98aa]">Admin</p></div>
            <button type="button" onClick={() => setActiveNav('Settings')} aria-label="Open settings" className="text-[#9aa6b8] transition hover:text-[#536176]"><Settings2 size={16} /></button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[72px] items-center justify-between border-b border-[#e5eaf1] bg-white/80 px-5 backdrop-blur sm:px-8">
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block"><Search size={16} className="absolute left-3 top-2.5 text-[#9aa6b8]" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search tasks..." aria-label="Search tasks" className="w-56 rounded-lg border border-[#e6eaf0] bg-[#f8fafc] py-2 pl-9 pr-3 text-xs outline-none transition focus:border-blue-300" /></div>
              <span className="hidden h-5 w-px bg-[#e6eaf0] sm:block" />
              <p className="text-xs font-semibold text-[#8a96a8]">Workspace <span className="mx-1">/</span> <span className="text-[#172033]">Overview</span></p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-[#d8f1e4] bg-[#f0fdf4] px-3 py-1.5 text-[11px] font-bold text-[#16804a]"><span className="size-1.5 rounded-full bg-[#22c55e]" /> All systems operational</div>
              <Link href="/signin" className="inline-flex items-center justify-center rounded-lg bg-[#172033] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#26344d]">
                Sign in
              </Link>
              <div className="relative">
                <button type="button" onClick={() => setShowMoreMenu((open) => !open)} aria-label="Open more actions" className="hidden text-[#8a96a8] transition hover:text-[#536176] sm:block"><MoreHorizontal size={19} /></button>
                {showMoreMenu && <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-[#e5eaf1] bg-white p-1.5 text-xs shadow-xl"><button type="button" onClick={() => { setActiveNav('Settings'); setShowMoreMenu(false); }} className="w-full rounded-lg px-3 py-2 text-left font-semibold text-[#536176] hover:bg-[#f3f6fa]">Settings</button></div>}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-[1180px]">
              {messages.length === 0 ? (
                <>
                  <div className="flex items-start justify-between">
                    <div><p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-[#2563eb]">Friday, September 18</p><h1 className="text-3xl font-bold tracking-[-.04em] text-[#172033] sm:text-[38px]">Good morning, {userName.split(' ')[0]} <span className="inline-block">✦</span></h1><p className="mt-2 text-sm text-[#7d899b]">Your agents are ready to turn ideas into outcomes.</p></div>
                    <div className="hidden items-center gap-4 sm:flex">
                      <div className="h-20 w-28 overflow-hidden rounded-xl border border-[#dce7f8] bg-[#f5f9ff]">
                        <Viewpoint cameraPosition={[0, 0, 3.5]}>
                          <DashboardScene />
                        </Viewpoint>
                      </div>
                      <button type="button" onClick={() => setShowHistory((visible) => !visible)} className="flex items-center gap-2 rounded-lg border border-[#e1e6ee] bg-white px-3 py-2 text-xs font-semibold text-[#536176] shadow-sm"><Clock3 size={14} /> History <ChevronDown size={13} className={showHistory ? 'rotate-180 transition-transform' : 'transition-transform'} /></button>
                    </div>
                  </div>
                  <div className="mt-9 grid gap-4 sm:grid-cols-3">
                    <MetricCard label="Active tasks" value="03" detail="+2 this week" icon={<Activity size={17} />} color="blue" />
                    <MetricCard label="Tasks completed" value="28" detail="+18% this month" icon={<CheckCircle2 size={17} />} color="green" />
                    <MetricCard label="Time saved" value="14.5h" detail="Since last Monday" icon={<Zap size={17} />} color="orange" />
                  </div>
                  <div className="mt-9 grid gap-6 xl:grid-cols-[1fr_315px]">
                    <div className="rounded-2xl border border-[#e5eaf1] bg-white p-5 shadow-[0_8px_30px_rgba(30,60,100,.04)] sm:p-7">
                      <div className="flex items-center justify-between"><div><h2 className="text-base font-bold">Start with a task</h2><p className="mt-1 text-xs text-[#8c98aa]">Tell your agent what you need. It will handle the rest.</p></div><div className="grid size-9 place-items-center rounded-xl bg-[#eff6ff] text-[#2563eb]"><Bot size={19} /></div></div>
                      <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-[#dce3ed] bg-[#fbfcfe] p-2 transition focus-within:border-[#93b4f5] focus-within:ring-4 focus-within:ring-blue-50">
                        <textarea value={input} onChange={(event) => setInput(event.target.value)} disabled={isRunning} placeholder="What would you like to accomplish?" rows={3} className="w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 text-[#172033] outline-none placeholder:text-[#a4afbe]" />
                        <div className="flex items-center justify-between border-t border-[#edf0f4] px-2 pt-2"><AttachMenu onFileSelect={setSelectedFile} /><button type="submit" disabled={isRunning || !input.trim()} className="flex items-center gap-2 rounded-lg bg-[#2563eb] px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-blue-200 transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40">{isRunning ? 'Working...' : 'Run task'} <Send size={13} /></button></div>
                      </form>
                      <div className="mt-4 flex flex-wrap gap-2">{suggestions.map((suggestion) => <button key={suggestion.label} onClick={() => setInput(suggestion.prompt)} className="rounded-full border border-[#e5eaf1] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#69778b] transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#2563eb]">{suggestion.icon} &nbsp;{suggestion.label}</button>)}</div>
                    </div>
                    <div className="rounded-2xl border border-[#e5eaf1] bg-white p-5 shadow-[0_8px_30px_rgba(30,60,100,.04)]"><div className="flex items-center justify-between"><h2 className="text-sm font-bold">{showHistory ? 'Task history' : 'Recent tasks'}</h2><button type="button" onClick={() => setShowAllTasks((visible) => !visible)} className="text-[11px] font-bold text-[#2563eb]">{showAllTasks ? 'Show recent' : 'View all'}</button></div><div className="mt-4 space-y-1">{visibleTasks.map((task) => <div key={task.id} className="group rounded-xl p-3 transition hover:bg-[#f8fafc]"><div className="flex items-start gap-3"><div className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${task.tone === 'green' ? 'bg-[#ecfdf3] text-[#16a05d]' : 'bg-[#fff7ed] text-[#ea8a13]'}`}><CheckCircle2 size={14} /></div><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#354258]">{task.title}</p><p className="mt-1 text-[10px] text-[#9aa5b5]">{task.time}</p></div></div><p className={`ml-10 mt-2 text-[10px] font-bold ${task.tone === 'green' ? 'text-[#16a05d]' : 'text-[#d97706]'}`}>{task.status}</p></div>)}{visibleTasks.length === 0 && <p className="py-4 text-center text-xs text-[#9aa5b5]">No matching tasks.</p>}</div></div>
                  </div>
                  <div className="mt-8 flex items-center gap-3 rounded-xl border border-[#e5eaf1] bg-[#f8fafc] px-4 py-3 text-xs text-[#718096]"><Sparkles size={15} className="text-[#2563eb]" /><span><strong className="text-[#354258]">Tip:</strong> Agents work best with a clear outcome, useful context, and any constraints you have.</span><ArrowUpRight size={14} className="ml-auto" /></div>
                </>
              ) : (
                <div className="mx-auto max-w-3xl"><div className="mb-8 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#2563eb]">Live task</p><h1 className="mt-2 text-2xl font-bold tracking-tight">Agent activity</h1></div><div className="flex items-center gap-2 rounded-full bg-[#eff6ff] px-3 py-1.5 text-[11px] font-bold text-[#2563eb]"><span className={`size-1.5 rounded-full ${isRunning ? 'animate-pulse bg-blue-500' : 'bg-green-500'}`} /> {isRunning ? 'Working' : 'Complete'}</div></div><div className="space-y-4">{messages.map((message) => <MessageBubble key={message.id} message={message} />)}</div><form onSubmit={handleSubmit} className="sticky bottom-4 mt-8 flex items-center gap-2 rounded-xl border border-[#dce3ed] bg-white p-2 shadow-xl"><AttachMenu onFileSelect={setSelectedFile} /><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Continue the task..." disabled={isRunning} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#a4afbe]" /><button type="submit" disabled={isRunning || !input.trim()} className="grid size-9 place-items-center rounded-lg bg-[#2563eb] text-white disabled:opacity-40"><Send size={15} /></button></form></div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function NavItem({ icon, label, active, badge, onClick }: { icon: React.ReactNode; label: string; active?: boolean; badge?: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${active ? 'bg-[#eaf2ff] text-[#2563eb]' : 'text-[#758196] hover:bg-[#f3f6fa] hover:text-[#354258]'}`}>{icon}<span className="flex-1 text-left">{label}</span>{badge && <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] text-[#8c98aa]">{badge}</span>}</button>;
}

function MetricCard({ label, value, detail, icon, color }: { label: string; value: string; detail: string; icon: React.ReactNode; color: 'blue' | 'green' | 'orange' }) {
  const colors = { blue: 'bg-[#eff6ff] text-[#2563eb]', green: 'bg-[#ecfdf3] text-[#16a05d]', orange: 'bg-[#fff7ed] text-[#ea8a13]' };
  return <div className="rounded-2xl border border-[#e5eaf1] bg-white p-5 shadow-[0_8px_30px_rgba(30,60,100,.03)]"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-[#7e8a9d]">{label}</p><div className={`grid size-8 place-items-center rounded-lg ${colors[color]}`}>{icon}</div></div><div className="mt-4 flex items-end gap-2"><p className="text-2xl font-bold tracking-tight">{value}</p><p className="mb-1 text-[10px] font-semibold text-[#16a05d]">{detail}</p></div></div>;
}

function MessageBubble({ message }: { message: { id: string; role: string; parts: Array<{ type: string; text?: string }> } }) {
  return <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-[#2563eb] text-white' : 'border border-[#e5eaf1] bg-white text-[#354258] shadow-sm'}`}>{message.parts.map((part, index) => part.type === 'text' ? <span key={`${message.id}-${index}`} className="whitespace-pre-wrap">{part.text}</span> : <span key={`${message.id}-${index}`} className="my-1 flex items-center gap-2 rounded-lg bg-[#f3f6fa] px-3 py-2 text-xs text-[#718096]"><TerminalSquare size={13} /> {part.type.replace('tool-', '')}</span>)}</div></div>;
}
