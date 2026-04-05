/**
 * Protocol Analysis Tabs Component
 * Deep inspection of DNS, HTTP, and TLS protocols
 */

import { useMemo, useState } from "react";
import { Globe, Lock, FileText, Search } from "lucide-react";
import { usePcapAnalyzer } from "../store";

export function ProtocolAnalysisTabs() {
  const { packets } = usePcapAnalyzer();
  const [activeTab, setActiveTab] = useState<"dns" | "http" | "tls">("dns");
  const [searchTerm, setSearchTerm] = useState("");

  // Extract DNS records
  const dnsRecords = useMemo(() => {
    return packets
      .filter((p) => p.dns && p.dns.length > 0)
      .flatMap((p) => p.dns || [])
      .map((dns, idx) => ({
        ...dns,
        id: `dns-${idx}`,
        timestamp: packets.find((p) => p.dns?.includes(dns))?.timestamp || Date.now(),
      }));
  }, [packets]);

  // Extract HTTP records
  const httpRecords = useMemo(() => {
    return packets
      .filter((p) => p.http && p.http.length > 0)
      .flatMap((p) => p.http || [])
      .map((http, idx) => ({
        ...http,
        id: `http-${idx}`,
        timestamp: packets.find((p) => p.http?.includes(http))?.timestamp || Date.now(),
      }));
  }, [packets]);

  // Extract TLS records
  const tlsRecords = useMemo(() => {
    return packets
      .filter((p) => p.tls && p.tls.length > 0)
      .flatMap((p) => p.tls || [])
      .map((tls, idx) => ({
        ...tls,
        id: `tls-${idx}`,
        timestamp: packets.find((p) => p.tls?.includes(tls))?.timestamp || Date.now(),
      }));
  }, [packets]);

  // Filter records by search term
  const filteredDns = useMemo(
    () =>
      dnsRecords.filter(
        (d) =>
          d.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.answer.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [dnsRecords, searchTerm]
  );

  const filteredHttp = useMemo(
    () =>
      httpRecords.filter(
        (h) =>
          h.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.url.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [httpRecords, searchTerm]
  );

  const filteredTls = useMemo(
    () =>
      tlsRecords.filter(
        (t) =>
          (t.serverName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (t.issuer?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      ),
    [tlsRecords, searchTerm]
  );

  return (
    <div className="flex flex-col h-full bg-slate-900/30 rounded-lg border border-slate-800/50 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-800/50 bg-slate-950/30">
        <button
          onClick={() => setActiveTab("dns")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "dns"
              ? "border-purple-500 text-purple-300"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <Globe className="w-4 h-4" />
          DNS ({dnsRecords.length})
        </button>
        <button
          onClick={() => setActiveTab("http")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "http"
              ? "border-purple-500 text-purple-300"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <FileText className="w-4 h-4" />
          HTTP ({httpRecords.length})
        </button>
        <button
          onClick={() => setActiveTab("tls")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "tls"
              ? "border-purple-500 text-purple-300"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <Lock className="w-4 h-4" />
          TLS ({tlsRecords.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-slate-800/50">
        <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded">
          <Search className="w-4 h-4 text-slate-500 ml-2" />
          <input
            type="text"
            placeholder={
              activeTab === "dns"
                ? "Search domains..."
                : activeTab === "http"
                ? "Search URLs..."
                : "Search certificates..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "dns" && (
          <div className="divide-y divide-slate-800/30">
            {filteredDns.length > 0 ? (
              filteredDns.map((dns) => (
                <div key={dns.id} className="p-4 hover:bg-slate-800/20 transition-colors">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Query</div>
                      <div className="text-sm font-mono text-blue-400 break-all">
                        {dns.query}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Answer</div>
                      <div className="text-sm font-mono text-green-400 break-all">
                        {dns.answer}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Type</div>
                      <div className="text-sm text-slate-300">{dns.type}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    {new Date(dns.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-500">
                No DNS records found
              </div>
            )}
          </div>
        )}

        {activeTab === "http" && (
          <div className="divide-y divide-slate-800/30">
            {filteredHttp.length > 0 ? (
              filteredHttp.map((http) => (
                <div key={http.id} className="p-4 hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        http.method === "GET"
                          ? "bg-blue-500/20 text-blue-300"
                          : http.method === "POST"
                          ? "bg-orange-500/20 text-orange-300"
                          : "bg-slate-700/20 text-slate-300"
                      }`}
                    >
                      {http.method}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        parseInt(String(http.statusCode || "200")) < 300
                          ? "bg-green-500/20 text-green-300"
                          : parseInt(String(http.statusCode || "200")) < 400
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {http.statusCode || "Pending"}
                    </span>
                  </div>

                  <div className="mb-2">
                    <div className="text-xs text-slate-500 mb-1">URL</div>
                    <div className="text-sm font-mono text-slate-300 break-all hover:text-purple-400 cursor-pointer">
                      {http.url}
                    </div>
                  </div>

                  {http.host && (
                    <div className="mb-2">
                      <div className="text-xs text-slate-500 mb-1">Host</div>
                      <div className="text-sm font-mono text-slate-300">
                        {http.host}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-slate-500">
                    {new Date(http.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-500">
                No HTTP records found
              </div>
            )}
          </div>
        )}

        {activeTab === "tls" && (
          <div className="divide-y divide-slate-800/30">
            {filteredTls.length > 0 ? (
              filteredTls.map((tls) => (
                <div key={tls.id} className="p-4 hover:bg-slate-800/20 transition-colors">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Server Name</div>
                      <div className="text-sm font-mono text-blue-400 break-all">
                        {tls.serverName}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Issuer</div>
                        <div className="text-sm text-slate-300 break-all">
                          {tls.issuer}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Subject</div>
                        <div className="text-sm text-slate-300 break-all">
                          {tls.subject}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-slate-500 mb-1">Valid From</div>
                        <div className="font-mono text-slate-300">
                          {tls.validFrom ? new Date(tls.validFrom).toLocaleDateString() : "N/A"}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 mb-1">Valid Until</div>
                        <div className="font-mono text-slate-300">
                          {tls.validUntil ? new Date(tls.validUntil).toLocaleDateString() : "N/A"}
                        </div>
                      </div>
                    </div>

                    {tls.fingerprint && (
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Fingerprint (SHA1)</div>
                        <div className="text-xs font-mono text-slate-300 break-all">
                          {tls.fingerprint}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 mt-3">
                    {new Date(tls.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-500">
                No TLS records found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
