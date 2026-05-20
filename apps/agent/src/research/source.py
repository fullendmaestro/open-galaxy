from langchain.tools import ToolRuntime, tool
from langchain_core.messages import ToolMessage
from langgraph.types import Command # Added this import for state updates
import uuid
from typing import Literal, Optional, TypedDict

class SourceMetadata(TypedDict):  
    id: str  
    type: Literal["url", "pdf"]  
    url: Optional[str]  
    fileName: Optional[str]  
    title: Optional[str]  
    summary: Optional[str]  

@tool
def listSources(runtime: ToolRuntime):
    """
    List all sources.
    """
    return runtime.state.get("sources", [])

@tool
def manageSources(sources: list[SourceMetadata], runtime: ToolRuntime) -> Command:
    """
    Manage the current list of sources.
    """
    # Ensure all sources have unique IDs
    for source in sources:
        if "id" not in source or not source["id"]:
            source["id"] = str(uuid.uuid4())

    # Return a Command to directly update the graph state
    return Command(update={
        "sources": sources,
        "messages": [
            ToolMessage(
                content="Successfully updated sources",
                tool_call_id=runtime.tool_call_id
            )
        ]
    })

source_tools = [
    listSources,
    manageSources,
]