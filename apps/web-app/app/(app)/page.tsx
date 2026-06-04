"use client";

import { useSuggestions } from "@/hooks";
import {
  CopilotChat,
  CopilotChatConfigurationProvider,
} from "@copilotkit/react-core/v2";
import { useChatContext } from "@/components/chat-provider";

export default function HomePage() {
  const { threadId } = useChatContext();
  useSuggestions();

  return (
    <div className="flex flex-1 flex-col w-full h-full relative">
      <CopilotChatConfigurationProvider agentId="default" threadId={threadId}>
        <CopilotChat
          attachments={{ enabled: true }}
          input={{ disclaimer: () => null, className: "pb-6" }}
          className="h-full"
        />
      </CopilotChatConfigurationProvider>
    </div>
  );
}
