"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Role = "user" | "assistant";
type Message = { role: Role; content: string; reasoning?: string };

type ModelGroup = {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  systemPrompt: string;
};

const storageKey = "construct-chat:model-groups";

const defaultGroup: ModelGroup = {
  id: "default",
  name: "默认组",
  baseUrl: "",
  model: "",
  apiKey: "",
  systemPrompt: "",
};

const defaultMessages: Message[] = [];

function uid() {
  return `group-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseStreamChunk(raw: string) {
  return raw
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.replace(/^data:\s*/, "").trim())
    .filter(Boolean);
}

function normalizeGroup(group: Partial<ModelGroup>, index: number): ModelGroup {
  return {
    id: String(group.id || uid()),
    name: String(group.name || `模型组 ${index + 1}`),
    baseUrl: String(group.baseUrl || ""),
    model: String(group.model || ""),
    apiKey: String(group.apiKey || ""),
    systemPrompt: String(group.systemPrompt || ""),
  };
}

function parseStoredGroups(raw: string | null) {
  if (!raw) return null;

  let parsed: unknown = JSON.parse(raw);
  if (typeof parsed === "string") parsed = JSON.parse(parsed);

  const record = parsed as {
    groups?: Partial<ModelGroup>[];
    modelGroups?: Partial<ModelGroup>[];
    activeGroupId?: string;
    active?: string;
  };
  const rawGroups = Array.isArray(parsed)
    ? parsed
    : Array.isArray(record.groups)
      ? record.groups
      : Array.isArray(record.modelGroups)
        ? record.modelGroups
        : [];

  const groups = rawGroups.map(normalizeGroup).filter((group) => group.id && group.name);
  if (groups.length === 0) return null;

  const wantedId = record.activeGroupId || record.active;
  const activeGroupId = groups.some((group) => group.id === wantedId) ? wantedId! : groups[0].id;
  return { groups, activeGroupId };
}

function readStoredGroups() {
  if (typeof window === "undefined") return null;
  return parseStoredGroups(window.localStorage.getItem(storageKey));
}

export default function Home() {
  const [initialStored] = useState(() => {
    try {
      return readStoredGroups();
    } catch {
      return null;
    }
  });
  const [groups, setGroups] = useState<ModelGroup[]>(() => initialStored?.groups || [defaultGroup]);
  const [activeGroupId, setActiveGroupId] = useState(() => initialStored?.activeGroupId || defaultGroup.id);
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(Boolean(initialStored));
  const [storageStatus, setStorageStatus] = useState(
    initialStored ? `首屏已载入 ${initialStored.groups.length} 个本地模型组` : "等待客户端读取本地配置…"
  );
  const [clientStatus, setClientStatus] = useState(() =>
    typeof window === "undefined" ? "客户端未启动" : "客户端代码已启动"
  );

  const activeGroup = groups.find((group) => group.id === activeGroupId) || groups[0] || defaultGroup;
  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  function loadGroupsFromStorage() {
    try {
      const parsed = readStoredGroups();
      if (parsed) {
        setGroups(parsed.groups);
        setActiveGroupId(parsed.activeGroupId);
        setStorageStatus(`已载入 ${parsed.groups.length} 个本地模型组`);
      } else {
        setStorageStatus("未发现可用本地模型组");
      }
    } catch (err) {
      setStorageStatus("本地模型组 JSON 无法解析");
      console.error("Failed to parse model groups from localStorage", err);
    } finally {
      setHydrated(true);
    }
  }

  useEffect(() => {
    setClientStatus("客户端 effect 已执行");
    if (!initialStored) loadGroupsFromStorage();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify({ groups, activeGroupId }));
  }, [groups, activeGroupId, hydrated]);

  function updateActiveGroup(patch: Partial<ModelGroup>) {
    setGroups((current) => current.map((group) => (group.id === activeGroup.id ? { ...group, ...patch } : group)));
  }

  function createGroup() {
    const next: ModelGroup = {
      ...defaultGroup,
      id: uid(),
      name: `模型组 ${groups.length + 1}`,
    };
    setGroups((current) => [...current, next]);
    setActiveGroupId(next.id);
  }

  function duplicateGroup() {
    const next: ModelGroup = {
      ...activeGroup,
      id: uid(),
      name: `${activeGroup.name} 副本`,
    };
    setGroups((current) => [...current, next]);
    setActiveGroupId(next.id);
  }

  function deleteGroup() {
    if (groups.length === 1) return;
    const nextGroups = groups.filter((group) => group.id !== activeGroup.id);
    setGroups(nextGroups);
    setActiveGroupId(nextGroups[0].id);
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const assistantMessage: Message = { role: "assistant", content: "" };
    const requestMessages = [...messages, userMessage];

    setMessages([...requestMessages, assistantMessage]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: requestMessages, ...activeGroup }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "请求失败");
      }

      if (!response.body) throw new Error("浏览器没有拿到响应流");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      let fullReasoning = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const boundary = buffer.lastIndexOf("\n\n");
        if (boundary < 0) continue;

        const chunk = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        for (const payload of parseStreamChunk(chunk)) {
          if (payload === "[DONE]") continue;
          try {
            const data = JSON.parse(payload);
            const choice = data?.choices?.[0];
            const contentDelta = choice?.delta?.content || "";
            const reasoningDelta =
              choice?.delta?.reasoning_content ||
              choice?.delta?.reasoning ||
              choice?.delta?.reasoningContent ||
              "";

            if (!contentDelta && !reasoningDelta) continue;

            fullText += contentDelta;
            fullReasoning += reasoningDelta;
            setMessages((current) => {
              const next = [...current];
              next[next.length - 1] = {
                role: "assistant",
                content: fullText,
                reasoning: fullReasoning,
              };
              return next;
            });
          } catch {
            // Ignore malformed SSE fragments. Providers love being weird little goblins.
          }
        }
      }

      if (!fullText && !fullReasoning) {
        setMessages((current) => {
          const next = [...current];
          next[next.length - 1] = {
            role: "assistant",
            content: "模型沉默了，真没礼貌。",
          };
          return next;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
      setMessages((current) => current.filter((_, index) => index !== current.length - 1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero" aria-label="项目标题">
        <div className="redBlock" />
        <div className="blackLine" />
        <div>
          <p className="eyebrow">STREAMING / MODEL GROUPS / CONSTRUCTIVISM</p>
          <h1>Construct Chat</h1>
          <p className="tagline">模型组可保存可切换，系统提示词可控，输出像刀一样流出来。</p>
        </div>
      </section>

      <section className="workspace">
        <aside className="panel settings" aria-label="配置">
          <div className="panelHeader">
            <span>01</span>
            <h2>模型组</h2>
          </div>

          <div className="groupBar">
            <select value={activeGroup.id} onChange={(event) => setActiveGroupId(event.target.value)}>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <div className="groupActions">
              <button type="button" onClick={createGroup}>新建</button>
              <button type="button" onClick={duplicateGroup}>复制</button>
              <button type="button" onClick={deleteGroup} disabled={groups.length === 1}>删除</button>
            </div>
            <button type="button" className="reloadStorage" onClick={loadGroupsFromStorage}>
              重载本地配置
            </button>
            <div className="storageStatus">{clientStatus}</div>
            <div className="storageStatus">{storageStatus}</div>
          </div>

          <label>
            组名称
            <input
              placeholder="例如：OpenRouter / Local Ollama"
              value={activeGroup.name}
              onChange={(event) => updateActiveGroup({ name: event.target.value })}
            />
          </label>

          <label>
            基础路径
            <input
              placeholder="https://api.openai.com/v1"
              value={activeGroup.baseUrl}
              onChange={(event) => updateActiveGroup({ baseUrl: event.target.value })}
            />
          </label>

          <label>
            模型
            <input
              placeholder="gpt-4o-mini / deepseek-chat / ..."
              value={activeGroup.model}
              onChange={(event) => updateActiveGroup({ model: event.target.value })}
            />
          </label>

          <label>
            API Key
            <input
              type="password"
              placeholder="留空则使用服务端 AI_API_KEY"
              value={activeGroup.apiKey}
              onChange={(event) => updateActiveGroup({ apiKey: event.target.value })}
            />
          </label>

          <label>
            系统提示词
            <textarea
              className="systemPrompt"
              placeholder="告诉模型它是谁、怎么说话、该守什么规矩"
              value={activeGroup.systemPrompt}
              onChange={(event) => updateActiveGroup({ systemPrompt: event.target.value })}
            />
          </label>

          <div className="hint">
            模型组保存在浏览器 <code>localStorage</code>。换设备不会跟着走，别装惊讶。
          </div>
        </aside>

        <section className="panel chat" aria-label="聊天">
          <div className="panelHeader">
            <span>02</span>
            <h2>对话</h2>
          </div>

          <div className="messages">
            {messages.map((message, index) => (
              <article key={`${message.role}-${index}`} className={`message ${message.role} ${loading && index === messages.length - 1 ? "streaming" : ""}`}>
                <div className="role">{message.role === "user" ? "YOU" : "AI"}</div>
                <div className="messageBody">
                  {message.reasoning && (
                    <details className="reasoningBlock" open={loading && index === messages.length - 1}>
                      <summary>思维链 / Reasoning</summary>
                      <pre>{message.reasoning}</pre>
                    </details>
                  )}
                  <p>{message.content || "▋"}</p>
                </div>
              </article>
            ))}
          </div>

          {error && <div className="error">{error}</div>}

          <form className="composer" onSubmit={sendMessage}>
            <textarea
              placeholder="输入你的问题，按 Ctrl/⌘ + Enter 发送"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <button disabled={!canSend}>{loading ? "流式中" : "发送"}</button>
          </form>
        </section>
      </section>
    </main>
  );
}
