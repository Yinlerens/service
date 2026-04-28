# AI Chat Constructivist

一个极简、大气、构成主义风格的 Next.js AI 聊天界面。支持 OpenAI 兼容接口、模型组保存/切换、系统提示词配置、流式输出。

## 开发

```bash
npm install
cp .env.example .env.local
npm run dev
```

打开 http://localhost:3000

## 配置

环境变量默认值：

```bash
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
# 不填 AI_SYSTEM_PROMPT 就不会发送 system 消息
# AI_SYSTEM_PROMPT=
AI_API_KEY=你的默认密钥 # 可选；也可以在界面输入
```

界面模型组配置优先级更高，并保存在浏览器 `localStorage`：

- 组名称
- 基础路径
- 模型
- API Key
- 系统提示词（留空则不发送 system 消息）

基础路径应为 OpenAI-compatible base URL，例如：

- `https://api.openai.com/v1`
- `https://openrouter.ai/api/v1`
- `http://localhost:11434/v1`

## 生产启动

```bash
npm run build
npm run start -- --hostname 0.0.0.0 --port 3000
```
