/**
 * AI Analyst Panel Component
 * Chat-based interface for AI-powered packet analysis and insights
 */

import { useState, useRef, useEffect } from "react";
import { Send, Loader, Lightbulb, Command } from "lucide-react";
import { usePcapAnalyzer } from "../store";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export function AIAnalystPanel() {
  const { packets, flows, alerts } = usePcapAnalyzer();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "👋 I'm your AI Analyst. I can help you investigate suspicious traffic, understand protocol patterns, and identify threats. Try asking me questions about the captured packets!",
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulated AI analysis engine
  const generateAIResponse = (userQuery: string): string => {
    const query = userQuery.toLowerCase();

    // Analyze captured data
    const stats = {
      totalPackets: packets.length,
      totalFlows: flows.length,
      alerts: alerts.length,
      protocols: Array.from(new Set(packets.map((p) => p.protocol))),
      uniqueSources: Array.from(new Set(packets.map((p) => p.srcIp))).length,
      uniqueDests: Array.from(new Set(packets.map((p) => p.dstIp))).length,
    };

    // Pattern matching for responses
    if (query.includes("summary") || query.includes("overview")) {
      return `📊 **Capture Summary**\n\n• **Total Packets**: ${stats.totalPackets}\n• **Network Flows**: ${stats.totalFlows}\n• **Active Alerts**: ${stats.alerts}\n• **Protocols**: ${stats.protocols.join(", ")}\n• **Unique Sources**: ${stats.uniqueSources}\n• **Unique Destinations**: ${stats.uniqueDests}\n\nThis capture shows moderate network activity with ${stats.alerts > 0 ? "detected " + stats.alerts + " alerts that warrant investigation" : "no critical alerts detected"}.`;
    } else if (
      query.includes("threat") ||
      query.includes("malicious") ||
      query.includes("suspicious")
    ) {
      const highRiskAlerts = alerts.filter(
        (a) => a.severity === "critical" || a.severity === "high"
      );
      return `🔍 **Threat Analysis**\n\n**High-Risk Indicators**: ${highRiskAlerts.length}\n\n${
        highRiskAlerts.length > 0
          ? "**Detected Issues**:\n" +
            highRiskAlerts
              .slice(0, 3)
              .map((a) => `• ${a.title}: ${a.description}`)
              .join("\n") +
            "\n\n**Recommendation**: Escalate to incident response team"
          : "No critical threats detected on the protocol level.\n\n**Recommendation**: Monitor for behavioral anomalies"
      }`;
    } else if (query.includes("flow") || query.includes("connection")) {
      return `🔗 **Flow Analysis**\n\n**Total Flows**: ${stats.totalFlows}\n**Average Packets per Flow**: ${Math.round(stats.totalPackets / Math.max(stats.totalFlows, 1))}\n\n**Largest Flows**:\n${flows
        .slice(0, 3)
        .map((f, i) => `${i + 1}. ${f.srcIp} → ${f.dstIp}:${f.dstPort} (${f.packetCount} packets)`)
        .join("\n")}\n\nThese flows represent the primary communication channels in your network.`;
    } else if (query.includes("dns") || query.includes("domain")) {
      const dnsRecords = packets.flatMap((p) => p.dns || []);
      return `🌐 **DNS Activity**\n\n**DNS Queries**: ${dnsRecords.length}\n\n${
        dnsRecords.length > 0
          ? "**Sample Domains**:\n" +
            dnsRecords
              .slice(0, 5)
              .map((d) => `• ${d.query} → ${d.answer}`)
              .join("\n")
          : "No DNS activity detected in this capture."
      }\n\n**Analysis**: Monitor for suspicious domain resolutions and known malicious domains.`;
    } else if (query.includes("http") || query.includes("web")) {
      const httpRecords = packets.flatMap((p) => p.http || []);
      return `🌐 **HTTP/Web Activity**\n\n**HTTP Requests**: ${httpRecords.length}\n\n${
        httpRecords.length > 0
          ? "**Sample Requests**:\n" +
            httpRecords
              .slice(0, 3)
              .map((h) => `• ${h.method} ${h.url} (${h.statusCode})`)
              .join("\n")
          : "No HTTP traffic detected."
      }\n\n**Security Note**: Review credentials and sensitive data in HTTP traffic.`;
    } else if (query.includes("tls") || query.includes("ssl") || query.includes("certificate")) {
      const tlsRecords = packets.flatMap((p) => p.tls || []);
      return `🔒 **TLS/SSL Analysis**\n\nEncrypted Connections: ${tlsRecords.length}\n\n${
        tlsRecords.length > 0
          ? "**Sample Certificates**:\n" +
            tlsRecords
              .slice(0, 3)
              .map(
                (t) =>
                  `• ${t.serverName || "Unknown"}\n  Issuer: ${(t.issuer || "Unknown").substring(0, 50)}...`
              )
              .join("\n\n")
          : "No TLS activity detected."
      }\n\n**Recommendation**: Verify certificate chains for legitimacy.`;
    } else if (query.includes("port")) {
      const ports = new Set(flows.map((f) => f.dstPort));
      return `🔌 **Port Analysis**\n\n**Unique Destination Ports**: ${ports.size}\n**Top Ports**: ${Array.from(ports)
        .slice(0, 5)
        .join(", ")}\n\nCommon services:\n• Port 53 → DNS\n• Port 80 → HTTP\n• Port 443 → HTTPS\n• Port 22 → SSH`;
    } else if (query.includes("help") || query.includes("what can")) {
      return `❓ **I can help with:**\n\n💡 **Analysis Topics**:\n• Summary of network activity\n• Threat and suspicious activity detection\n• Flow analysis and communication patterns\n• DNS queries and domain resolution\n• HTTP/HTTPS traffic review\n• TLS/SSL certificate analysis\n• Port usage and service identification\n• Protocol distribution analysis\n• Timeline and temporal patterns\n• Anomaly detection insights\n\n**Try asking**: "What threats were detected?" or "Show me flow analysis"`;
    } else {
      return `🤔 I'm analyzing your question: "${userQuery}"\n\n**Analysis Results**:\n• **Packet Count**: ${stats.totalPackets}\n• **Network Flows**: ${stats.totalFlows}\n• **Detected Anomalies**: ${stats.alerts > 0 ? "Yes - " + stats.alerts + " alerts" : "None detected"}\n\nFor more specific analysis, try asking about:\n- Traffic summary\n- Threat indicators\n- DNS/HTTP/TLS activity\n- Flow patterns\n- Port usage\n\nWhat would you like to investigate further?`;
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputValue);
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: aiResponse,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 800);
  };

  const quickActions = [
    { label: "📊 Summary", query: "Give me a summary of this capture" },
    {
      label: "🔍 Threats",
      query: "What threats or suspicious activity were detected?",
    },
    { label: "🔗 Flows", query: "Analyze the network flows" },
    { label: "🌐 DNS", query: "Show DNS queries" },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900/30 rounded-lg border border-slate-800/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/50 bg-slate-950/50 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-yellow-400" />
        <h3 className="text-sm font-semibold text-slate-200">AI Analyst</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === "user"
                  ? "bg-purple-500/30 text-purple-100"
                  : "bg-slate-800/50 text-slate-100"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
              <p className="text-xs opacity-50 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin text-slate-400" />
                <span className="text-sm text-slate-400">Analyzing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="px-4 py-3 border-t border-slate-800/50 grid grid-cols-2 gap-2">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputValue(action.query);
              }}
              className="px-3 py-2 text-xs bg-slate-800/50 hover:bg-slate-700/50 rounded border border-slate-700/50 transition-colors text-slate-300 hover:text-slate-200"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-slate-800/50 bg-slate-950/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask me about the network traffic..."
            className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 text-slate-200 placeholder-slate-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white rounded transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          💡 Tip: Ask about threats, flows, DNS, HTTP, TLS, ports, or request a summary
        </p>
      </div>
    </div>
  );
}
