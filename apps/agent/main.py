import os
import uvicorn
from fastapi import FastAPI
from dotenv import load_dotenv

# LangChain & LangGraph imports
from langchain_openai import AzureChatOpenAI # <-- Import AzureChatOpenAI
from langchain.agents import create_agent
from langgraph.checkpoint.memory import MemorySaver

# CopilotKit & AG-UI imports
from copilotkit import CopilotKitMiddleware, LangGraphAGUIAgent
from ag_ui_langgraph import add_langgraph_fastapi_endpoint

# 1. Load environment variables from the .env file
load_dotenv()

# 2. Initialize the FastAPI application
app = FastAPI()

# 3. Build the LangChain Agent Graph
def build_agent_graph():
    # Initialize the Azure OpenAI model
    model = AzureChatOpenAI(
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        # temperature=0.7, # Optional: Add standard model kwargs here
    ) 
    
    return create_agent(
        model=model,
        tools=[], # Add any backend-specific python tools here
        middleware=[CopilotKitMiddleware()], # Connects frontend UI tools
        checkpointer=MemorySaver(),          # Enables conversational memory
        system_prompt="You are a helpful AI assistant."
    )

# 4. Wrap the graph in the AG-UI CopilotKit format
agent = LangGraphAGUIAgent(
    name="my_custom_agent",
    description="A standalone backend agent using Azure",
    graph=build_agent_graph(),
)

# 5. Mount the agent endpoint to the FastAPI app
add_langgraph_fastapi_endpoint(app=app, agent=agent, path="/copilotkit")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)