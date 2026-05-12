import { CopilotRuntime, createCopilotEndpoint } from "@copilotkit/runtime/v2";
import { LangGraphHttpAgent } from "@copilotkit/runtime/langgraph"; // or "@ag-ui/langgraph"
import { NextRequest } from "next/server";

// Point to the standalone FastAPI backend you just built
const langGraphAgent = new LangGraphHttpAgent({
  url:
    process.env.LANGGRAPH_DEPLOYMENT_URL || "http://127.0.0.1:8000/copilotkit",
});

const runtime = new CopilotRuntime({
  agents: {
    default: langGraphAgent,
  },
});

// Create the generic web standard endpoint
const app = createCopilotEndpoint({
  runtime,
  basePath: "/api/copilotkit",
});

// Next.js App Router requires named HTTP method exports
// We pass the NextRequest directly to the generic fetch handler
export const POST = (req: NextRequest) => app.fetch(req);
