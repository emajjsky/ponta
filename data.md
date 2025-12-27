root@VM-12-4-ubuntu:~/pontaponta# pnpm build

> ponta-ponta@0.1.0 build /root/pontaponta
> next build

▲ Next.js 16.1.1 (Turbopack)
- Environments: .env

⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
  Creating an optimized production build ...
✓ Compiled successfully in 7.4s
  Running TypeScript  ..Failed to compile.

./lib/providers/coze.ts:53:37
Type error: Property 'content' does not exist on type 'CreateChatData | ChatV3Message | "[DONE]" | { code: number; msg: string; }'.
  Property 'content' does not exist on type 'CreateChatData'.

  51 |       // 处理流式响应
  52 |       for await (const chunk of stream) {
> 53 |         const content = chunk.data?.content || ''
     |                                     ^
  54 |         const isComplete = chunk.event === 'conversation.message.completed'
  55 |
  56 |         yield {
Next.js build worker exited with code: 1 and signal: null