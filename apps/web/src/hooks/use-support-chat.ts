'use client';

import * as React from 'react';
import { apiClient } from '@/lib/api-client';
import { getSupportSocket, disconnectSupportSocket } from '@/lib/socket-client';
import { tokenStorage } from '@/lib/token-storage';

export type SupportMessage = {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderType: 'user' | 'agent' | 'ai' | 'system';
  type: 'text' | 'image' | 'file' | 'system' | 'note';
  content: string;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  isRead: boolean;
  createdAt: string;
};

export type SupportConversation = {
  id: string;
  status: 'waiting' | 'ai_active' | 'assigned' | 'active' | 'resolved' | 'closed';
  subject?: string;
  isAiHandling: boolean;
  unreadCount: number;
  lastMessageAt?: string;
  messages: SupportMessage[];
};

export function useSupportChat() {
  const [conversation, setConversation] = React.useState<SupportConversation | null>(null);
  const [messages, setMessages] = React.useState<SupportMessage[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [typingUsers, setTypingUsers] = React.useState<Set<string>>(new Set());
  const [agentOnline, setAgentOnline] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const socketRef = React.useRef<ReturnType<typeof getSupportSocket> | null>(null);
  const typingTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const initSocket = React.useCallback((convId: string) => {
    const token = tokenStorage.getAccessToken();
    if (!token) return;

    const socket = getSupportSocket(token);
    socketRef.current = socket;

    socket.emit('conversation:join', { conversationId: convId });

    socket.on('message:new', (msg: SupportMessage) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('typing:start', ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => new Set([...prev, userId]));
    });

    socket.on('typing:stop', ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    socket.on('conversation:handoff', () => {
      setConversation((prev) => prev ? { ...prev, status: 'waiting', isAiHandling: false } : prev);
    });

    socket.on('user:online', ({ userId }: { userId: string }) => {
      // Could track agent online status here
    });

    socket.on('messages:read', () => {
      setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
    });
  }, []);

  const openChat = React.useCallback(async () => {
    setIsOpen(true);
    if (conversation) return;

    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.support.start({});
      const conv = (data as any)?.data ?? data;
      setConversation(conv);
      setMessages(conv.messages ?? []);
      initSocket(conv.id);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  }, [conversation, initSocket]);

  const closeChat = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const sendMessage = React.useCallback(async (content: string, file?: { url: string; name: string; mimeType: string }) => {
    if (!conversation || !content.trim()) return;
    setSending(true);
    try {
      // Optimistic user message
      const optimistic: SupportMessage = {
        id: `opt-${Date.now()}`,
        conversationId: conversation.id,
        senderId: 'me',
        senderType: 'user',
        type: file ? (file.mimeType.startsWith('image/') ? 'image' : 'file') : 'text',
        content,
        fileUrl: file?.url,
        fileName: file?.name,
        mimeType: file?.mimeType,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      // Send via socket if connected, else REST fallback
      if (socketRef.current?.connected) {
        socketRef.current.emit('message:send', {
          conversationId: conversation.id,
          content,
          fileUrl: file?.url,
          fileName: file?.name,
          mimeType: file?.mimeType,
        });
      } else {
        const result = await apiClient.support.send(conversation.id, { content, fileUrl: file?.url, fileName: file?.name, mimeType: file?.mimeType });
        const r = (result as any)?.data ?? result;
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== optimistic.id),
          r.userMessage,
          ...(r.aiMessage ? [r.aiMessage] : []),
        ]);
        if (r.handoff) {
          setConversation((prev) => prev ? { ...prev, status: 'waiting', isAiHandling: false } : prev);
        }
      }
    } finally {
      setSending(false);
    }
  }, [conversation]);

  const requestHandoff = React.useCallback(async () => {
    if (!conversation) return;
    await apiClient.support.handoff(conversation.id);
    setConversation((prev) => prev ? { ...prev, status: 'waiting', isAiHandling: false } : prev);
  }, [conversation]);

  const sendTyping = React.useCallback((isTyping: boolean) => {
    if (!conversation || !socketRef.current?.connected) return;
    if (isTyping) {
      socketRef.current.emit('typing:start', { conversationId: conversation.id });
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        socketRef.current?.emit('typing:stop', { conversationId: conversation.id });
      }, 3000);
    } else {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      socketRef.current.emit('typing:stop', { conversationId: conversation.id });
    }
  }, [conversation]);

  React.useEffect(() => {
    return () => {
      disconnectSupportSocket();
    };
  }, []);

  return {
    conversation,
    messages,
    isOpen,
    loading,
    sending,
    typingUsers,
    agentOnline,
    error,
    openChat,
    closeChat,
    sendMessage,
    requestHandoff,
    sendTyping,
  };
}
