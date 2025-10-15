import { db, isFirebaseConfigured } from '../firebase';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import type { Chat, ChatMessage } from '../types';

const useFirebase = isFirebaseConfigured() && !!db;

const sharedKey = (k: string) => `timebank_shared_${k}`;
const loadShared = <T>(key: string, fb: T[] = []) => {
  try { const s = localStorage.getItem(sharedKey(key)); return s ? JSON.parse(s) : fb; } catch { return fb; }
};
const saveShared = <T>(key: string, data: T[]) => { try { localStorage.setItem(sharedKey(key), JSON.stringify(data)); } catch {} };

export const chatService = {
  async getOrCreateChat(userId: string, peerId: string, serviceId?: string, myPubKey?: JsonWebKey): Promise<Chat> {
    if (useFirebase) {
      // Find existing chat with both participants
      const q = query(collection(db, 'chats'), where('participants', 'array-contains', userId));
      const snap = await getDocs(q);
      let chat: Chat | null = null;
      snap.forEach((d) => {
        const data = d.data() as any;
        if (Array.isArray(data.participants) && data.participants.includes(peerId)) {
          chat = { id: d.id, ...data, created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString() } as Chat;
        }
      });
      if (chat) return chat;

      // Create new chat
      const payload: any = {
        participants: [userId, peerId],
        participantsPublicKeys: myPubKey ? { [userId]: myPubKey } : {},
        service_id: serviceId || null,
        created_at: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, 'chats'), payload);
      return { id: ref.id, participants: [userId, peerId], participantsPublicKeys: payload.participantsPublicKeys, service_id: serviceId, created_at: new Date().toISOString() } as Chat;
    }

    // Shared local fallback
    const chats = loadShared<Chat>('chats', []);
  let chat = chats.find((c: Chat) => c.participants.includes(userId) && c.participants.includes(peerId));
    if (chat) return chat;
    chat = { id: Date.now().toString(), participants: [userId, peerId], participantsPublicKeys: myPubKey ? { [userId]: myPubKey } : {}, service_id: serviceId, created_at: new Date().toISOString() };
    chats.push(chat);
    saveShared('chats', chats);
    return chat;
  },

  async publishPublicKey(chatId: string, userId: string, jwk: JsonWebKey): Promise<void> {
    if (useFirebase) {
      const ref = doc(db, 'chats', chatId);
      const d = await getDoc(ref);
      const data = d.exists() ? d.data() as any : {};
      const updated = { ...(data || {}), participantsPublicKeys: { ...(data?.participantsPublicKeys || {}), [userId]: jwk } };
      await setDoc(ref, updated, { merge: true });
      return;
    }
    const chats = loadShared<Chat>('chats', []);
  const idx = chats.findIndex((c: Chat) => c.id === chatId);
    if (idx !== -1) {
      const c = chats[idx];
      c.participantsPublicKeys = { ...(c.participantsPublicKeys || {}), [userId]: jwk } as any;
      chats[idx] = c;
      saveShared('chats', chats);
    }
  },

  async getChatPublicKeys(chatId: string): Promise<Record<string, JsonWebKey>> {
    if (useFirebase) {
      const d = await getDoc(doc(db, 'chats', chatId));
      const data = d.exists() ? (d.data() as any) : {};
      return (data?.participantsPublicKeys || {}) as Record<string, JsonWebKey>;
    }
  const chat = loadShared<Chat>('chats', []).find((c: Chat) => c.id === chatId);
    return (chat?.participantsPublicKeys || {}) as Record<string, JsonWebKey>;
  },

  async sendMessage(chatId: string, msg: Omit<ChatMessage, 'id' | 'created_at' | 'chat_id'>): Promise<ChatMessage> {
    if (useFirebase) {
      const payload: any = {
        ...msg,
        created_at: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, 'chats', chatId, 'messages'), payload);
      return { id: ref.id, chat_id: chatId, ...msg, created_at: new Date().toISOString() } as ChatMessage;
    }
    const messages = loadShared<ChatMessage>(`chat_${chatId}_messages`, []);
    const newMsg: ChatMessage = { id: Date.now().toString(), chat_id: chatId, ...msg, created_at: new Date().toISOString() };
    messages.push(newMsg);
    saveShared(`chat_${chatId}_messages`, messages);
    return newMsg;
  },

  subscribeMessages(chatId: string, cb: (msgs: ChatMessage[]) => void): () => void {
    if (useFirebase) {
      const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('created_at', 'asc'));
      const unsub = onSnapshot(q, (snap) => {
        const arr: ChatMessage[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          arr.push({ id: d.id, chat_id: chatId, ...data, created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString() });
        });
        cb(arr);
      });
      return unsub;
    }
    // Polling fallback for shared local
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      const arr = loadShared<ChatMessage>(`chat_${chatId}_messages`, []);
      cb(arr);
      setTimeout(tick, 1000);
    };
    tick();
    return () => { stopped = true; };
  },
};
