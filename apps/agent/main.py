"""
This is the main entry point for the agent.
It defines the workflow graph, state, tools, nodes and edges.
"""

import os
from dotenv import load_dotenv

from copilotkit import CopilotKitMiddleware, StateStreamingMiddleware, StateItem
from langchain.agents import create_agent

# Data & state tools
from src.research.main import AgentState, research_tools
from langchain_openai import AzureChatOpenAI

load_dotenv()

model = AzureChatOpenAI(
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        # temperature=0.7, # Optional: Add standard model kwargs here
    )

agent = create_agent(
    model=model,
    tools=[*research_tools],
    middleware=[
        CopilotKitMiddleware(),
        StateStreamingMiddleware(
            # Stream updates directly to the frontend when these tools are called
            StateItem(
                state_key="sources", 
                tool="manageSources", 
                tool_argument="sources"
            ),
            StateItem(
                state_key="sprint_reports", 
                tool="manageSprintReports", 
                tool_argument="sprint_reports"
            )
        ),
    ],
    state_schema=AgentState,
    system_prompt="""
        You are a professional research assistant for the Hex hub platform.
        Your primary role is to manage verifiable research ledgers, synthesize findings into structured Sprint Reports, 
        and maintain strict tracking of source references. Ensure all persistent memory references (blobIds) are 
        properly handled for the MemWal architecture.
    """,
)

graph = agent