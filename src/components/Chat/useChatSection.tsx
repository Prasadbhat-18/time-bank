import React from 'react';
import { Chat } from '../../types';
import { ChatInboxModal } from './ChatInboxModal';
import { ChatWindow } from './ChatWindow';

interface ChatSectionState {
  showInbox: boolean;
  activeChat: { chat: Chat; peerId: string } | null;
}

export function useChatSection() {
  const [state, setState] = React.useState<ChatSectionState>({ showInbox: false, activeChat: null });

  const openInbox = () => {
    console.log('📥 Opening chat inbox...');
    setState((s) => ({ ...s, showInbox: true }));
  };
  const closeInbox = () => setState((s) => ({ ...s, showInbox: false }));
  const openChat = (chat: Chat, peerId: string) => setState({ showInbox: false, activeChat: { chat, peerId } });
  const closeChat = () => setState((s) => ({ ...s, activeChat: null }));

  const ChatSectionUI = () => (
    <>
      {state.showInbox && <ChatInboxModal onSelectChat={openChat} onClose={closeInbox} />}
      {state.activeChat && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 pointer-events-none">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 pointer-events-auto">
            <ChatWindow peerId={state.activeChat.peerId} onClose={closeChat} />
          </div>
        </div>
      )}
    </>
  );

  return { openInbox, ChatSectionUI };
}
