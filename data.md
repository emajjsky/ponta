root@VM-12-4-ubuntu:~/ponta# pkill -9 node
root@VM-12-4-ubuntu:~/ponta# e
Command 'e' not found, but can be installed with:
apt install e-wrapper
root@VM-12-4-ubuntu:~/ponta#  sleep 2
root@VM-12-4-ubuntu:~/ponta# pm2 delete all
[PM2] Applying action deleteProcessId on app [all](ids: [ 0 ])
[PM2] [ponta](0) ✓
┌────┬───────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name      │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
└────┴───────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
root@VM-12-4-ubuntu:~/ponta# rm -rf .next
root@VM-12-4-ubuntu:~/ponta# rm -rf node_modules/.cache
root@VM-12-4-ubuntu:~/ponta# pnpm install
Lockfile is up to date, resolution step is skipped
Already up to date

   ╭──────────────────────────────────────────╮
   │                                          │
   │   Update available! 10.26.2 → 10.27.0.   │
   │   Changelog: https://pnpm.io/v/10.27.0   │
   │     To update, run: pnpm add -g pnpm     │
   │                                          │
   ╰──────────────────────────────────────────╯

Done in 1.1s using pnpm v10.26.2
root@VM-12-4-ubuntu:~/ponta# pnpm prisma generate
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v5.22.0) to ./node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client in 218ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Want to turn off tips and other hints? https://pris.ly/tip-4-nohints

root@VM-12-4-ubuntu:~/ponta# pnpm build

> ponta-ponta@0.1.0 build /root/ponta
> next build

▲ Next.js 16.1.1 (Turbopack)
- Environments: .env

⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
  Creating an optimized production build ...
✓ Compiled successfully in 7.4s
✓ Finished TypeScript in 8.9s    
✓ Collecting page data using 3 workers in 629.6ms    
✓ Generating static pages using 3 workers (87/87) in 803.2ms
✓ Finalizing page optimization in 14.9ms    

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /activate
├ ƒ /admin
├ ○ /admin/activation-codes
├ ○ /admin/agents
├ ƒ /admin/agents/[id]
├ ○ /admin/agents/new
├ ○ /admin/orders
├ ○ /admin/series
├ ƒ /admin/series/[id]
├ ○ /admin/series/new
├ ○ /admin/users
├ ● /agents/[slug]
│ ├ /agents/ultraman-tiga
│ ├ /agents/ultraman-zero
│ ├ /agents/ultraman-mebius
│ └ [+33 more paths]
├ ƒ /api/activate
├ ƒ /api/activation-codes/status/[status]
├ ƒ /api/admin/activation-codes
├ ƒ /api/admin/agents
├ ƒ /api/admin/agents/[id]
├ ƒ /api/admin/default-config
├ ƒ /api/admin/orders
├ ƒ /api/admin/series
├ ƒ /api/admin/series/[id]
├ ƒ /api/admin/stats
├ ƒ /api/admin/upload
├ ƒ /api/admin/users
├ ƒ /api/admin/users/[id]
├ ƒ /api/agents
├ ƒ /api/agents/[slug]
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/me
├ ƒ /api/auth/register
├ ƒ /api/chat
├ ƒ /api/chat/history
├ ƒ /api/exchange/cancel
├ ƒ /api/exchange/direct-trade
├ ƒ /api/exchange/handle
├ ƒ /api/exchange/market
├ ƒ /api/exchange/my
├ ƒ /api/exchange/propose
├ ƒ /api/exchange/publish
├ ƒ /api/exchange/verify-code
├ ƒ /api/shop/series
├ ƒ /api/shop/series/[slug]
├ ƒ /api/uploads/[...path]
├ ƒ /api/user-agents
├ ƒ /api/user/addresses
├ ƒ /api/user/addresses/[id]
├ ƒ /api/user/experience
├ ƒ /api/user/profile
├ ƒ /api/user/upload-avatar
├ ƒ /chat/[slug]
├ ƒ /exchange/market
├ ƒ /exchange/my
├ ƒ /exchange/publish
├ ƒ /login
├ ƒ /my-agents
├ ƒ /profile
├ ○ /profile/edit
├ ○ /register
├ ƒ /shop
└ ƒ /shop/series/[slug]


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand

root@VM-12-4-ubuntu:~/ponta# pm2 start npm --name "ponta" -- start
[PM2] Starting /usr/bin/npm in fork_mode (1 instance)
[PM2] Done.
┌────┬──────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name     │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼──────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ ponta    │ default     │ N/A     │ fork    │ 2161241  │ 0s     │ 0    │ online    │ 0%       │ 21.4mb   │ root     │ disabled │
└────┴──────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
root@VM-12-4-ubuntu:~/ponta# pm2 logs ponta
[TAILING] Tailing last 15 lines for [ponta] process (change the value with --lines option)
/root/.pm2/logs/ponta-error.log last 15 lines:
0|ponta    |   clientVersion: '5.22.0',
0|ponta    |   meta: [Object]
0|ponta    | }
0|ponta    | 登录错误: Error [PrismaClientKnownRequestError]: 
0|ponta    | Invalid `prisma.user.findUnique()` invocation:
0|ponta    | 
0|ponta    | 
0|ponta    | The column `users.phoneVerified` does not exist in the current database.
0|ponta    |     at async y (.next/server/chunks/[root-of-the-server]__b0eee974._.js:1:2258)
0|ponta    |     at async u (.next/server/chunks/[root-of-the-server]__b0eee974._.js:1:6007)
0|ponta    |     at async l (.next/server/chunks/[root-of-the-server]__b0eee974._.js:1:7048) {
0|ponta    |   code: 'P2022',
0|ponta    |   clientVersion: '5.22.0',
0|ponta    |   meta: [Object]
0|ponta    | }

/root/.pm2/logs/ponta-out.log last 15 lines:
0|ponta    | - Local:         http://localhost:3000
0|ponta    | - Network:       http://10.0.12.4:3000
0|ponta    | 
0|ponta    | ✓ Starting...
0|ponta    | ✓ Ready in 608ms
0|ponta    | 
0|ponta    | > ponta-ponta@0.1.0 start
0|ponta    | > next start
0|ponta    | 
0|ponta    | ▲ Next.js 16.1.1
0|ponta    | - Local:         http://localhost:3000
0|ponta    | - Network:       http://10.0.12.4:3000
0|ponta    | 
0|ponta    | ✓ Starting...
0|ponta    | ✓ Ready in 584ms

0|ponta  | 个人中心错误: Error [PrismaClientKnownRequestError]: 
0|ponta  | Invalid `prisma.user.findUnique()` invocation:
0|ponta  | The column `users.phoneVerified` does not exist in the current database.
0|ponta  |     at async r (.next/server/chunks/ssr/[root-of-the-server]__6763a037._.js:1:12235) {
0|ponta  |   code: 'P2022',
0|ponta  |   clientVersion: '5.22.0',
0|ponta  |   meta: [Object]
0|ponta  | }
0|ponta  | 登录错误: Error [PrismaClientKnownRequestError]: 
0|ponta  | Invalid `prisma.user.findUnique()` invocation:
0|ponta  | The column `users.phoneVerified` does not exist in the current database.
0|ponta  |     at async y (.next/server/chunks/[root-of-the-server]__b0eee974._.js:1:2258)
0|ponta  |     at async u (.next/server/chunks/[root-of-the-server]__b0eee974._.js:1:6007)
0|ponta  |     at async l (.next/server/chunks/[root-of-the-server]__b0eee974._.js:1:7048) {
0|ponta  |   code: 'P2022',
0|ponta  |   clientVersion: '5.22.0',
0|ponta  |   meta: [Object]
0|ponta  | }
0|ponta  | 注册错误: Error [PrismaClientKnownRequestError]: 
0|ponta  | Invalid `prisma.user.findUnique()` invocation:
0|ponta  | The column `users.phoneVerified` does not exist in the current database.
0|ponta  |     at async y (.next/server/chunks/[root-of-the-server]__9fea47d6._.js:1:2565)
0|ponta  |     at async u (.next/server/chunks/[root-of-the-server]__9fea47d6._.js:1:6334)
0|ponta  |     at async l (.next/server/chunks/[root-of-the-server]__9fea47d6._.js:1:7375) {
0|ponta  |   code: 'P2022',
0|ponta  |   clientVersion: '5.22.0',
0|ponta  |   meta: [Object]
0|ponta  | }
0|ponta  | 登录错误: Error [PrismaClientKnownRequestError]: 
0|ponta  | Invalid `prisma.user.findUnique()` invocation:
0|ponta  | The column `users.phoneVerified` does not exist in the current database.
0|ponta  |     at async y (.next/server/chunks/[root-of-the-server]__b0eee974._.js:1:2258)
0|ponta  |     at async u (.next/server/chunks/[root-of-the-server]__b0eee974._.js:1:6007)
0|ponta  |     at async l (.next/server/chunks/[root-of-the-server]__b0eee974._.js:1:7048) {
0|ponta  |   code: 'P2022',
0|ponta  |   clientVersion: '5.22.0',
0|ponta  |   meta: [Object]
0|ponta  | }
