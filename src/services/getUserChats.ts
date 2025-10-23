import { db, isFirebaseConfigured } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Chat } from '../types';

const useFirebase = isFirebaseConfigured() && !!db;

export async function getUserChats(userId: string): Promise<Chat[]> {
  if (useFirebase) {
    // Find all chats where user is a participant
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', userId));
    const snap = await getDocs(q);
    const chats: Chat[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      chats.push({ id: d.id, ...data, created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString() });
    });
    return chats;
  }
  // Local fallback
  const chats = JSON.parse(localStorage.getItem('timebank_shared_chats') || '[]');
  return chats.filter((c: Chat) => c.participants.includes(userId));
}
