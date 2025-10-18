import React, { useEffect, useRef, useState } from 'react';
import type { Chat, ChatMessage, Service } from '../../types';
import { chatService } from '../../services/chatService';
import { useE2EE } from '../../hooks/useE2EE';
import { useAuth } from '../../contexts/AuthContext';
import { Send } from 'lucide-react';
import { dataService } from '../../services/dataService';

interface Props {
  peerId: string;
  service?: Service;
  onClose?: () => void;
  embedded?: boolean; // When true, renders as embedded component, not full-screen overlay
}

export const ChatWindow: React.FC<Props> = ({ peerId, service, onClose, embedded: _embedded = false }) => {
  const { user } = useAuth();
  const { getOrCreateKeyPair, exportPublicJwk, importPublicJwk, deriveSharedKey, encrypt, decrypt } = useE2EE();
  const [chat, setChat] = useState<Chat | null>(null);
  const [sharedKey, setSharedKey] = useState<CryptoKey | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const pendingQueue = useRef<string[]>([]);
  const [peerName, setPeerName] = useState<string>('');
  const [sentTick, setSentTick] = useState<number>(0);
  const [peerTyping, setPeerTyping] = useState(false);
  const typingThrottleRef = useRef<number>(0);

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
          console.log('ChatWindow: deriving shared key with peer', peerId);
          const peerKey = await importPublicJwk(peerPub);
          const sk = await deriveSharedKey(kp.privateKey, peerKey);
          setSharedKey(sk);
          console.log('ChatWindow: shared key established');
          return true;
        }
        return false;
      };
      
      const derived = await tryDerive();
      
      // Poll for peer key for a short while if missing
      if (!derived) {
        console.log('ChatWindow: polling for peer public key...');
        const start = Date.now();
        const pollInterval = setInterval(async () => {
          if (stop || Date.now() - start > 15000) {
            clearInterval(pollInterval);
            if (!stop) console.warn('ChatWindow: timed out waiting for peer key');
            return;
          }
          const success = await tryDerive();
          if (success) {
            clearInterval(pollInterval);
            // Send any queued messages
            if (pendingQueue.current.length > 0) {
              console.log(`ChatWindow: sending ${pendingQueue.current.length} queued messages`);
              const q = [...pendingQueue.current];
              pendingQueue.current = [];
              for (const text of q) await sendEncrypted(text);
            }
          }
        }, 1500);
      }
      
      unsub = chatService.subscribeMessages(c.id, (msgs) => {
        console.log(`ChatWindow: received ${msgs.length} messages from subscription`);
        setMessages(msgs);
      });
      // Subscribe to chat doc to listen for typing pings from peer
      const unsubDoc = chatService.subscribeChatDoc(c.id, (doc) => {
        const t = doc?.typing?.[peerId];
        let ms = 0;
        if (typeof t === 'string') {
          const parsed = Date.parse(t);
          ms = isNaN(parsed) ? 0 : parsed;
        } else if (t && typeof t.toDate === 'function') {
          ms = t.toDate().getTime();
        } else if (typeof t === 'number') {
          ms = t;
        }
        const isTyping = ms > 0 && Date.now() - ms < 4000; // 4s window
        setPeerTyping(isTyping);
      });
      // chain into same unsub cleanup
      const prevUnsub = unsub;
      unsub = () => { try { prevUnsub && prevUnsub(); } catch {} try { unsubDoc && (unsubDoc as any)(); } catch {} };
      
      // mark last seen for unread accuracy
      await chatService.setLastSeen(c.id, user.id);
    })();
    return () => {
      stop = true;
      if (unsub) unsub();
      // Persist lastSeen on close/unmount
      if (user && chat) {
        // fire-and-forget
        chatService.setLastSeen(chat.id, user.id).catch(() => {});
      }
    };
  }, [user?.id, peerId, service?.id]);

  // Load peer name for a more authentic header
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await dataService.getUserById(peerId);
        if (!cancelled) setPeerName(u?.username || u?.email || peerId);
      } catch {
        if (!cancelled) setPeerName(peerId);
      }
    })();
    return () => { cancelled = true; };
  }, [peerId]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);


  useEffect(() => {
    (async () => {
      if (!sharedKey) {
        console.log('ChatWindow: waiting for shared key...');
        return;
      }
      console.log(`ChatWindow: decrypting ${messages.length} messages...`);
      const parts: { id: string; sender_id: string; text: string; created_at: string }[] = [];
      for (const m of messages) {
        try {
          const text = await decrypt(sharedKey, m.ciphertext, m.iv);
          parts.push({ id: m.id, sender_id: m.sender_id, text, created_at: m.created_at });
        } catch (err) {
          console.warn('Failed to decrypt message', m.id, err);
        }
      }
      console.log(`ChatWindow: decrypted ${parts.length} messages successfully`);
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
  // flash a subtle "sent" indicator
  setSentTick((n) => n + 1);
  };

  const handleInputChange = async (val: string) => {
    setInput(val);
    if (!user || !chat) return;
    const now = Date.now();
    if (now - typingThrottleRef.current > 1500) { // throttle pings to ~1.5s
      typingThrottleRef.current = now;
      try { await chatService.setTyping(chat.id, user.id); } catch {}
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <div className="font-semibold">Chat with {peerName || peerId}</div>
            {service && <div className="text-sm text-gray-600">Regarding: {service.title}</div>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                if (user && chat) {
                  try { await chatService.setLastSeen(chat.id, user.id); } catch {}
                }
                onClose && onClose();
              }}
              className="px-3 py-1.5 rounded bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {(decryptedRef.current || []).map((m, idx, arr) => {
            const curDate = new Date(m.created_at);
            const prev = idx > 0 ? new Date(arr[idx - 1].created_at) : null;
            const showDayHeader = !prev || prev.toDateString() !== curDate.toDateString();
            return (
              <React.Fragment key={m.id}>
                {showDayHeader && (
                  <div className="text-[11px] text-gray-400 text-center my-2 select-none">
                    {curDate.toDateString()}
                  </div>
                )}
                <div className={`max-w-[75%] px-3 py-2 rounded-lg ${m.sender_id === user?.id ? 'bg-emerald-600 text-white self-end ml-auto' : 'bg-gray-100 text-gray-800'}`}>
                  <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                  <div className="text-[10px] opacity-60 mt-1">{curDate.toLocaleTimeString()}</div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
        <div className="p-3 border-t border-gray-200 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button onClick={handleSend} className="px-3 py-2 rounded bg-emerald-600 text-white flex items-center gap-1">
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
        {(peerTyping || sentTick > 0) && (
          <div className="px-4 pb-3 text-xs text-gray-400 select-none flex items-center gap-4">
            {peerTyping && <span>typing…</span>}
            {sentTick > 0 && <span>Message sent</span>}
          </div>
        )}
      </div>
    </div>
  );
};
