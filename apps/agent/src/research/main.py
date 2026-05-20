from langchain.agents import AgentState as BaseAgentState  
from typing import TypedDict, Literal, List, Optional  
from datetime import datetime  

# Assuming you saved the previous snippets in these respective files:
from src.research.source import SourceMetadata, source_tools
from src.research.sprint import SprintReport, sprint_report_tools

class AgentState(BaseAgentState):  
    # Ephemeral context for current session (RAG)  
    sources: List[SourceMetadata]   
    sprint_reports: List[SprintReport]  # Added to track the sprint reports
    active_sprint_id: Optional[str]  

    # MemWal long-term memory context  
    memwal_account_id: str  
    sprint_context_block: Optional[str] # Pre-built context from previous research  

    # Results from search/recall tools to be used by the LLM  
    retrieved_chunks: List[dict]  
    past_findings: List[dict]

# Combine all tools into a single list for the agent
research_tools = [
    *source_tools,
    *sprint_report_tools,
]