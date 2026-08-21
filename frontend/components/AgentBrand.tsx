"use client";

import { Bot } from "lucide-react";
import { usePreferences } from "@/components/theme-provider";

export function AgentBrand() {
  const { agent_name, agent_icon } = usePreferences();
  return (
    <span className="agent-brand" aria-label={`${agent_name}, your assistant`}>
      {agent_icon ? <img src={agent_icon} alt="" className="agent-brand-icon" /> : <Bot size={22} aria-hidden="true" />}
      <span>{agent_name}</span>
    </span>
  );
}
