'use client';

import * as React from 'react';
import { cn } from '@crackncode/ui';
import {
  MessageCircle, X, Send, Paperclip, Bot, User, UserCheck,
  Clock, CheckCheck, ChevronDown, AlertCircle, Loader2,
} from 'lucide-react';
import { useSupportChat } from '@/hooks/use-support-chat';
import { useAuth } from '@/providers/auth-provider';
import type { SupportMessage } from '@/hooks/use-support-chat';

function timeStr(d: string) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({ msg, isOwn }: { msg: SupportMessage; isOwn: boolean }) {
  const isSystem = msg.senderType === 'system';
  const isNote = msg.type === 'note';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">{msg.content}</span>
      </div>
    );
  }

  if (isNote) {
    return (
      <div className="flex justify-center my-1">
        <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-full italic">
          📝 Internal note: {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2 mb-3', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-auto',
        msg.senderType === 'ai' && 'bg-primary/10 text-primary',
        msg.senderType === 'agent' && 'bg-green-500/10 text-green-600',
        msg.senderType === 'user' && 'bg-muted text-muted-foreground',
      )}>
        {msg.senderType === 'ai' && <Bot className="h-3.5 w-3.5" />}
        {msg.senderType === 'agent' && <UserCheck className="h-3.5 w-3.5" />}
        {msg.senderType === 'user' && <User className="h-3.5 w-3.5" />}
      </div>

      <div className={cn('max-w-[75%] flex flex-col gap-1', isOwn && 'items-end')}>
        {/* File/image */}
        {msg.fileUrl && msg.type === 'image' && (
          <img src={msg.fileUrl} alt={msg.fileName ?? 'image'} className="rounded-lg max-w-full max-h-40 object-cover" />
        )}
        {msg.fileUrl && msg.type === 'file' && (
          <a
            href={msg.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-2 rounded-xl px-3 py-2 text-xs border',
              isOwn ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border',
            )}
          >
            <Paperclip className="h-3 w-3 shrink-0" />
            {msg.fileName ?? 'File'}
          </a>
        )}

        {/* Text bubble */}
        {msg.content && (
          <div className={cn(
            'rounded-2xl px-3 py-2 text-sm leading-relaxed',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : msg.senderType === 'ai'
              ? 'bg-primary/10 text-foreground rounded-bl-sm border border-primary/20'
              : 'bg-muted text-foreground rounded-bl-sm',
          )}>
            {msg.content}
          </div>
        )}

        {/* Meta */}
        <div className={cn('flex items-center gap-1 text-2xs text-muted-foreground', isOwn && 'flex-row-reverse')}>
          <span>{timeStr(msg.createdAt)}</span>
          {isOwn && msg.isRead && <CheckCheck className="h-3 w-3 text-primary" />}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 mb-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2.5 flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    ai_active:  { label: 'AI Support',      color: 'bg-primary/10 text-primary' },
    waiting:    { label: 'Waiting for agent', color: 'bg-amber-500/10 text-amber-600' },
    assigned:   { label: 'Agent assigned',   color: 'bg-blue-500/10 text-blue-600' },
    active:     { label: 'Live support',     color: 'bg-green-500/10 text-green-600' },
    resolved:   { label: 'Resolved',         color: 'bg-muted text-muted-foreground' },
    closed:     { label: 'Closed',           color: 'bg-muted text-muted-foreground' },
  };
  const m = map[status] ?? map.ai_active;
  return (
    <span className={cn('text-2xs font-medium px-2 py-0.5 rounded-full', m.color)}>{m.label}</span>
  );
}

export function SupportChatWidget() {
  const { user } = useAuth();
  const {
    conversation, messages, isOpen, loading, sending,
    typingUsers, error, openChat, closeChat, sendMessage,
    requestHandoff, sendTyping,
  } = useSupportChat();

  const [input, setInput] = React.useState('');
  const [unread, setUnread] = React.useState(0);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers.size]);

  // Track unread when closed
  React.useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.senderType !== 'user') setUnread((n) => n + 1);
    } else {
      setUnread(0);
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    sendTyping(false);
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    sendTyping(e.target.value.length > 0);
  };

  if (!user) return null;

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={openChat}
          className="fixed bottom-6 right-6 z-[300] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
          aria-label="Open support chat"
        >
          <MessageCircle className="h-6 w-6" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-2xs font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[300] flex flex-col w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-6rem)] rounded-2xl border border-border bg-background shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">CracknCode Support</p>
              {conversation && <StatusBadge status={conversation.status} />}
            </div>
            <button
              onClick={closeChat}
              className="rounded-md p-1 hover:bg-primary-foreground/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0">
            {loading && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {!loading && messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isOwn={msg.senderType === 'user'}
              />
            ))}

            {typingUsers.size > 0 && <TypingIndicator />}

            {/* Waiting state */}
            {conversation?.status === 'waiting' && (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <Clock className="h-8 w-8 text-amber-500 animate-pulse" />
                <p className="text-sm font-medium text-foreground">Connecting you to an agent…</p>
                <p className="text-xs text-muted-foreground">Average wait time: ~2 minutes</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Handoff banner */}
          {conversation?.isAiHandling && conversation.status === 'ai_active' && (
            <div className="px-4 py-2 bg-muted/50 border-t border-border shrink-0">
              <button
                onClick={requestHandoff}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Talk to a human agent
              </button>
            </div>
          )}

          {/* Input */}
          {conversation && !['resolved', 'closed'].includes(conversation.status) && (
            <div className="flex items-end gap-2 px-3 py-3 border-t border-border shrink-0">
              <input
                ref={fileInputRef as any}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  // File upload would need a separate upload endpoint
                  // Placeholder for now
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                rows={1}
                className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-h-24 overflow-y-auto"
                style={{ minHeight: '38px' }}
              />

              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          )}

          {/* Closed state */}
          {conversation && ['resolved', 'closed'].includes(conversation.status) && (
            <div className="px-4 py-3 border-t border-border text-center shrink-0">
              <p className="text-xs text-muted-foreground">This conversation is {conversation.status}.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
