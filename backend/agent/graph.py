import os
from langgraph.prebuilt import create_react_agent
from agent.tools import ALL_TOOLS
from agent.prompts import SYSTEM_PROMPT
from llm.provider import get_llm

def build_agent():
    """
    Builds a LangGraph agent using the prebuilt ReAct pattern.
    
    This gives us the full "reason, call a tool, observe result,
    repeat until done" loop without writing the graph by hand.
    """
    llm = get_llm()
    agent = create_react_agent(llm, ALL_TOOLS, messages_modifier=SYSTEM_PROMPT)
    return agent

def ask_agent(question: str) -> str:
    """
    Runs a single question through the agent and returns the final answer.
    
    Args:
        question: The user query string.
        
    Returns:
        The text content of the agent's final message response.
    """
    agent = build_agent()
    result = agent.invoke({"messages": [("user", question)]})
    # The final answer is the last message in the conversation
    final_message = result["messages"][-1]
    return final_message.content
