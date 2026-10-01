'use client';

import * as React from 'react';
import { cn, Badge, Button } from '@crackncode/ui';
import { PageHeader } from '@/components/layout/page-header';
import {
  MessageCircle, User, Bot, UserCheck, Clock, CheckCircle2,
  XCircle, RefreshCw, Send, StickyNote, Loader2, AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { getSupportSocket } from '@/lib/socket-client';
import { tokenStorage } from '@/lib/token-storage';
import { useAuth } from '@/providers/auth-provider';

type ConvStatus = 'waiting' | 'ai_active' | 'assigned' | 'active' | 'resolved' | 'closed';

const STATUS_TABS: { key: ConvStatus | 'all'; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'waiting',  label: 'Waiting' },
  { key: 'active',   label: 'Active' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed',   label: 'Closed' },
];

const STATUS_COLOR: Record<string, string> = {
  waiting:   'bg-amber-500/10 text-amber-600 border-amber-200',
  ai_active: 'bg-primary/10 text-primary border-primary/20',
  assigned:  'bg-blue-500/10 text-blue-600 border-blue-200',
  active:    'bg-green-500/10 text-green-600 border-green-200',
  resolved:  'bg-muted text-muted-foreground border-border',
  closed:    'bg-muted text-muted-foreground border-border',
};

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function SenderIcon({ type }: { type: string }) {
  if (type === 'ai') return <Bot className="h-3.5 w-3.5 text-primary" />;
  if (type === 'agent') return <UserCheck className="h-3.5 w-3.5 text-green-600" />;
  if (type === 'system') return <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />;
  return <User className="h-3.5 w-3.5 text-muted-foreground" />;
}

export default function AgentChatPage() {
  const { user } = useAuth();
  const [tab, setTab] = React.useState<ConvStatus | 'all'>('all');
  const [conversations, setConversations] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [input, setInput] = React.useState('');
  const [noteMode, setNoteMode] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [typingUsers, setTypingUsers] = React.useState<Set<string>>(new Set());
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const socketRef = React.useRef<any>(null);

  const loadConversations = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.agent.conversations(tab === 'all' ? undefined : tab);
      const list = (data as any)?.data ?? data;
      setConversations(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  React.useEffect(() => { loadConversations(); }, [loadConversations]);

  // Socket setup
  React.useEffect(() => {
    const token = tokenStorage.getAccessToken();
    if (!token) return;
    const socket = getSupportSocket(token);
    socketRef.current = socket;
    socket.emit('agent:join');

    socket.on('conversation:waiting', () => loadConversations());
    socket.on('message:new', (msg: any) => {
      if (selected && msg.conversationId === selected.id) {
        setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
      }
      loadConversations();
    });
    socket.on('typing:start', ({ userId }: any) => setTypingUsers((p) => new Set([...p, userId])));
    socket.on('typing:stop', ({ userId }: any) => setTypingUsers((p) => { const n = new Set(p); n.delete(userId); return n; }));

    return () => {
      socket.off('conversation:waiting');
      socket.off('message:new');
      socket.off('typing:start');
      socket.off('typing:stop');
    };
  }, [selected, loadConversations]);

  const selectConversation = async (conv: any) => {
    setSelected(conv);
    setMessages([]);
    socketRef.current?.emit('conversation:join', { conversationId: conv.id });
    const data = await apiClient.agent.messages(conv.id);
    const msgs = (data as any)?.data ?? data;
    setMessages(Array.isArray(msgs) ? msgs : []);
    await apiClient.agent.conversations(); // mark read
  };

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers.size]);

  const handleAssign = async () => {
    if (!selected || !user) return;
    await apiClient.agent.assign(selected.id, (user as any).id);
    loadConversations();
    setSelected((p: any) => p ? { ...p, status: 'assigned', assignedAgentId: (user as any).id } : p);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !selected || sending) return;
    setSending(true);
    setInput('');
    try {
      if (noteMode) {
        const data = await apiClient.agent.note(selected.id, text);
        const msg = (data as any)?.data ?? data;
        setMessages((p) => [...p, msg]);
      } else if (socketRef.current?.connected) {
        socketRef.current.emit('agent:message:send', { conversationId: selected.id, content: text });
      } else {
        const data = await apiClient.agent.send(selected.id, { content: text });
        const msg = (data as any)?.data ?? data;
        setMessages((p) => [...p, msg]);
      }
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!selected) return;
    await apiClient.agent.resolve(selected.id);
    setSelected((p: any) => p ? { ...p, status: 'resolved' } : p);
    loadConversations();
  };

  const handleReopen = async () => {
    if (!selected) return;
    await apiClient.agent.reopen(selected.id);
    setSelected((p: any) => p ? { ...p, status: 'active' } : p);
    loadConversations();
  };

  const filteredConvs = tab === 'all' ? conversations : conversations.filter((c) => c.status === tab);

  return (
    <div className="flex flex-col h-[calc(100vh-var(--topbar-height)-2rem)] space-y-0">
      <PageHeader
        title="Support Inbox"
        description="Manage customer support conversations."
        breadcrumbs={[{ label: 'Support' }]}
      />

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Left: conversation list */}
        <div className="w-80 shrink-0 flex flex-col rounded-xl border border-border bg-card overflow-hidden">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-border px-2 pt-2 gap-1 shrink-0">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'shrink-0 px-2.5 py-1.5 text-xs font-medium rounded-t-md transition-colors',
                  tab === t.key
                    ? 'bg-background border border-b-background border-border text-foreground -mb-px'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label}
                {t.key === 'waiting' && conversations.filter((c) => c.status === 'waiting').length > 0 && (
                  <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-2xs text-white font-bold">
                    {conversations.filter((c) => c.status === 'waiting').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <MessageCircle className="h-8 w-8 opacity-30" />
                <p className="text-sm">No conversations</p>
              </div>
            ) : (
              filteredConvs.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={cn(
                    'w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors',
                    selected?.id === conv.id && 'bg-accent',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {conv.user?.profile?.name ?? conv.user?.email ?? 'User'}
                        </p>
                        <span className="text-2xs text-muted-foreground shrink-0">
                          {conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.messages?.[0]?.content ?? conv.subject ?? 'No messages yet'}
                      </p>
                      <span className={cn('mt-1 inline-block text-2xs font-medium px-1.5 py-0.5 rounded-full border', STATUS_COLOR[conv.status] ?? STATUS_COLOR.closed)}>
                        {conv.status.replace('_', ' ')}
                      </span>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-2xs font-bold text-primary-foreground">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: message panel */}
        <div className="flex-1 flex flex-col rounded-xl border border-border bg-card overflow-hidden min-w-0">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <MessageCircle className="h-12 w-12 opacity-20" />
              <p className="text-sm">Select a conversation to start</p>
            </div>
          ) : (
            <>
              {/* Conv header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {selected.user?.profile?.name ?? selected.user?.email ?? 'User'}
                  </p>
                  <span className={cn('text-2xs font-medium px-1.5 py-0.5 rounded-full border', STATUS_COLOR[selected.status] ?? STATUS_COLOR.closed)}>
                    {selected.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {(selected.status === 'waiting' || selected.status === 'ai_active') && (
                    <Button size="sm" variant="outline" onClick={handleAssign} className="gap-1.5 text-xs">
                      <UserCheck className="h-3.5 w-3.5" /> Assign to me
                    </Button>
                  )}
                  {['assigned', 'active'].includes(selected.status) && (
                    <Button size="sm" variant="outline" onClick={handleResolve} className="gap-1.5 text-xs text-green-600 border-green-200 hover:bg-green-50">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                    </Button>
                  )}
                  {['resolved', 'closed'].includes(selected.status) && (
                    <Button size="sm" variant="outline" onClick={handleReopen} className="gap-1.5 text-xs">
                      <RefreshCw className="h-3.5 w-3.5" /> Reopen
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {messages.map((msg) => {
                  const isSystem = msg.senderType === 'system';
                  const isNote = msg.type === 'note';
                  if (isSystem) return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">{msg.content}</span>
                    </div>
                  );
                  if (isNote) return (
                    <div key={msg.id} className="flex justify-center my-1">
                      <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-full italic">
                        📝 {msg.content}
                      </span>
                    </div>
                  );
                  const isAgent = msg.senderType === 'agent';
                  return (
                    <div key={msg.id} className={cn('flex gap-2 mb-3', isAgent ? 'flex-row-reverse' : 'flex-row')}>
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted mt-auto">
                        <SenderIcon type={msg.senderType} />
                      </div>
                      <div className={cn('max-w-[70%]', isAgent && 'items-end flex flex-col')}>
                        <div className={cn(
                          'rounded-2xl px-3 py-2 text-sm',
                          isAgent ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm',
                          msg.senderType === 'ai' && 'bg-primary/10 text-foreground border border-primary/20',
                        )}>
                          {msg.content}
                        </div>
                        <p className="text-2xs text-muted-foreground mt-1">
                          {msg.senderType} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {typingUsers.size > 0 && (
                  <div className="flex gap-2 mb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="bg-muted rounded-2xl px-3 py-2.5 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {!['resolved', 'closed'].includes(selected.status) && (
                <div className="border-t border-border px-3 py-3 shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setNoteMode(false)}
                      className={cn('text-xs px-2.5 py-1 rounded-full transition-colors', !noteMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent')}
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => setNoteMode(true)}
                      className={cn('flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors', noteMode ? 'bg-amber-500 text-white' : 'text-muted-foreground hover:bg-accent')}
                    >
                      <StickyNote className="h-3 w-3" /> Note
                    </button>
                  </div>
                  <div className="flex items-end gap-2">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder={noteMode ? 'Add internal note…' : 'Type a reply…'}
                      rows={2}
                      className={cn(
                        'flex-1 resize-none rounded-xl border px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        noteMode ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20' : 'border-input bg-background',
                      )}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || sending}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
