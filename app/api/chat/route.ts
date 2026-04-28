import { NextRequest, NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages = body.messages as ChatMessage[] | undefined;
    const baseUrl = normalizeBaseUrl(body.baseUrl || process.env.AI_BASE_URL || "https://api.openai.com/v1");
    const model = body.model || process.env.AI_MODEL || "gpt-4o-mini";
    const apiKey = body.apiKey || process.env.AI_API_KEY;
    const systemPrompt = body.systemPrompt ?? process.env.AI_SYSTEM_PROMPT ?? "";

    if (!Array.isArray(messages) || messages.length === 0) {
      return jsonError("messages 不能为空", 400);
    }

    if (!apiKey) {
      return jsonError("缺少 API Key：请在界面输入或设置 AI_API_KEY", 400);
    }

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(systemPrompt.trim() ? [{ role: "system", content: systemPrompt.trim() }] : []),
          ...messages.map((message) => ({ role: message.role, content: message.content })),
        ],
        temperature: 0.7,
        stream: true,
        extra_body: {"enable_thinking":true}
      }),
    });

    if (!upstream.ok) {
      const data = await upstream.json().catch(() => null);
      return jsonError(data?.error?.message || data?.message || `上游接口错误：${upstream.status}`, upstream.status);
    }

    if (!upstream.body) {
      return jsonError("上游没有返回流", 502);
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "服务端异常", 500);
  }
}
