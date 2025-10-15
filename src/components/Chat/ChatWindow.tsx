import React, { useEffect, useRef, useState } from 'react';
import type { Chat, ChatMessage, Service } from '../../types';
import { chatService } from '../../services/chatService';
import { useE2EE } from '../../hooks/useE2EE';
import { mediateTerms } from '../../services/aiMediator';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Bot } from 'lucide-react';

interface Props {
  peerId: string;
  service?: Service;
  onClose?: () => void;
}

export const ChatWindow: React.FC<Props> = ({ peerId, service, onClose }) => {
  const { user } = useAuth();
  const { getOrCreateKeyPair, exportPublicJwk, importPublicJwk, deriveSharedKey, encrypt, decrypt } = useE2EE();
  const [chat, setChat] = useState<Chat | null>(null);
  const [sharedKey, setSharedKey] = useState<CryptoKey | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const pendingQueue = useRef<string[]>([]);

  useEffect(() => {
    if (!user) return;
    let stop = false;
    let unsub: (() => void) | null = null;
    (async () => {
      const kp = await getOrCreateKeyPair();
      const myPub = await exportPublicJwk(kp.publicKey);
      const c = await chatService.getOrCreateChat(user.id, peerId, service?.id, myPub);
      if (stop) return;
      setChat(c);
      await chatService.publishPublicKey(c.id, user.id, myPub);
      const tryDerive = async () => {
        const keys = await chatService.getChatPublicKeys(c.id);
        const peerPub = keys[peerId];
        if (peerPub) {
          const peerKey = await importPublicJwk(peerPub);
          const sk = await deriveSharedKey(kp.privateKey, peerKey);
          setSharedKey(sk);
        }
      };
      await tryDerive();
      // Poll for peer key for a short while if missing
      if (!sharedKey) {
        const start = Date.now();
        const poll = setInterval(async () => {
          if (stop || sharedKey || Date.now() - start > 15000) {
            clearInterval(poll);
            return;
          }
          await tryDerive();
          if (sharedKey && pendingQueue.current.length > 0) {
            const q = [...pendingQueue.current];
            pendingQueue.current = [];
            for (const text of q) await sendEncrypted(text);
          }
        }, 1500);
      }
      unsub = chatService.subscribeMessages(c.id, setMessages);
    })();
    return () => {
      stop = true;
      if (unsub) unsub();
    };
  }, [user?.id, peerId, service?.id]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);


  useEffect(() => {
    (async () => {
      if (!sharedKey) return;
      const parts: { id: string; sender_id: string; text: string; created_at: string }[] = [];
      for (const m of messages) {
        try {
          const text = await decrypt(sharedKey, m.ciphertext, m.iv);
          parts.push({ id: m.id, sender_id: m.sender_id, text, created_at: m.created_at });
        } catch {
          // ignore decryption errors (e.g., system/older messages)
        }
      }
      // Replace memoized view by setting a separate state? Keep simple: store in ref
      (decryptedRef as any).current = parts;
      setViewTick((x) => x + 1);
    })();
  }, [messages, sharedKey]);

  const decryptedRef = useRef<{ id: string; sender_id: string; text: string; created_at: string }[]>([]);
  const [, setViewTick] = useState(0);

  const sendEncrypted = async (text: string) => {
    if (!user || !chat || !sharedKey || !text) return;
    const payload = await encrypt(sharedKey, text);
    await chatService.sendMessage(chat.id, {
      sender_id: user.id,
      ciphertext: payload.ciphertext,
      iv: payload.iv,
      type: 'text',
    });
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    if (!user || !chat) return;
    if (!sharedKey) {
      // Queue until shared key is derived
      pendingQueue.current.push(text);
      return;
    }
    await sendEncrypted(text);
  };

  const handleMediate = async () => {
    if (!user || !chat) return;
    // Use the last few messages (decrypted) as context
    const last = (decryptedRef.current || []).slice(-10);
    const dialogue = last.map((m) => `${m.sender_id === user.id ? 'Me' : 'Peer'}: ${m.text}`);
    try {
      const reply = await mediateTerms(dialogue, { serviceTitle: service?.title, participants: [user.username || user.email, peerId] });
      // Send mediator reply as a system message but still encrypted with our key so only participants can read it
      if (sharedKey) {
        const enc = await encrypt(sharedKey, `AI Proposal:\n${reply}`);
        await chatService.sendMessage(chat.id, {
          sender_id: 'ai-mediator',
          ciphertext: enc.ciphertext,
          iv: enc.iv,
          type: 'system',
        });
      }
    } catch (e) {
      console.error('AI mediator failed', e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <div className="font-semibold">Chat with {peerId}</div>
            {service && <div className="text-sm text-gray-600">Regarding: {service.title}</div>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleMediate} className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm flex items-center gap-1">
              <Bot className="w-4 h-4" /> Mediate
            </button>
            <button onClick={onClose} className="px-3 py-1.5 rounded bg-gray-100">Close</button>
          </div>
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {(decryptedRef.current || []).map((m) => (
            <div key={m.id} className={`max-w-[75%] px-3 py-2 rounded-lg ${m.sender_id === user?.id ? 'bg-emerald-600 text-white self-end ml-auto' : 'bg-gray-100 text-gray-800'}`}>
              <div className="text-sm whitespace-pre-wrap">{m.text}</div>
              <div className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-gray-200 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button onClick={handleSend} className="px-3 py-2 rounded bg-emerald-600 text-white flex items-center gap-1">
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
