import { CopilotChat } from "@copilotkit/react-core/v2";

export const agentId = "gemini";

export default function Home() {
  return <CopilotChat agentId={agentId} />;
}
