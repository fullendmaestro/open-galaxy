"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ChatContextType {
  threadId: string | undefined;
  setThreadId: (id: string | undefined) => void;
}

const ChatContext = createContext<ChatContextType>({
  threadId: undefined,
  setThreadId: () => {},
});

export function ChatProvider({ children }: { children: ReactNode }) {
  const [threadId, setThreadId] = useState<string | undefined>(undefined);

  return (
    <ChatContext.Provider value={{ threadId, setThreadId }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChatContext = () => useContext(ChatContext);
