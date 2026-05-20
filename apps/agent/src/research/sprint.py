from langchain.tools import ToolRuntime, tool
from langchain_core.messages import ToolMessage
from langgraph.types import Command
import uuid
from typing import List, TypedDict

class SprintReport(TypedDict):  
    blobId: str # MemWal/Walrus reference  
    title: str  
    summary: str  
    reportContent: str  
    tags: List[str]  

@tool
def listSprintReports(runtime: ToolRuntime):
    """
    List all sprint reports.
    """
    return runtime.state.get("sprint_reports", [])

@tool
def manageSprintReports(sprint_reports: List[SprintReport], runtime: ToolRuntime) -> Command:
    """
    Manage the current list of sprint reports.
    """
    # Ensure all sprint reports have unique blobIds
    for report in sprint_reports:
        if "blobId" not in report or not report["blobId"]:
            report["blobId"] = str(uuid.uuid4())

    # Return a Command to directly update the graph state
    return Command(update={
        "sprint_reports": sprint_reports,
        "messages": [
            ToolMessage(
                content="Successfully updated sprint reports",
                tool_call_id=runtime.tool_call_id
            )
        ]
    })

sprint_report_tools = [
    listSprintReports,
    manageSprintReports,
]