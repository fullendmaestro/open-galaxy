"use client";

import { ExampleLayout } from "@/components/example-layout";
import { ExampleCanvas } from "@/components/example-canvas";
import { useSuggestions } from "@/hooks";

import {
  CopilotChat,
  CopilotChatConfigurationProvider,
} from "@copilotkit/react-core/v2";
import { useState } from "react";
import ThreadsDrawer from "@/components/threads-drawer/threads-drawer";
import styles from "@/components/threads-drawer/threads-drawer.module.css";

export default function HomePage() {
  const [threadId, setThreadId] = useState<string | undefined>(undefined);

  useSuggestions();

  return (
    <div className={styles.layout}>
      <ThreadsDrawer
        agentId="default"
        threadId={threadId}
        onThreadChange={setThreadId}
      />

      <main className={styles.mainPanel}>
        <CopilotChatConfigurationProvider agentId="default" threadId={threadId}>
          <ExampleLayout
            chatContent={
              <CopilotChat
                attachments={{ enabled: true }}
                input={{ disclaimer: () => null, className: "pb-6" }}
              />
            }
            appContent={<ExampleCanvas />}
          />
        </CopilotChatConfigurationProvider>
      </main>
    </div>
  );
}
