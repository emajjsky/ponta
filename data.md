PS F:\AI作品集\ponta\pontaponta-master> 
                                        npx prisma generate  
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma

✔ Generated Prisma Client (v5.22.0) to .\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client in 76ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Need your database queries to be 1000x faster? Accelerate offers you that and more: https://pris.ly/tip-2-accelerate

PS F:\AI作品集\ponta\pontaponta-master> npx prisma migrate dev --name init_user_system  
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": SQLite database "dev.db" at "file:./dev.db"

Error: P3006

Migration `20251229_add_user_system` failed to apply cleanly to the shadow database.
Error:
SQLite database error
Cannot add a UNIQUE column
   0: sql_schema_connector::flavour::sqlite::sql_schema_from_migration_history
           with _shadow_database_connection_string=None _namespaces=None
             at schema-engine\connectors\sql-schema-connector\src\flavour\sqlite.rs:344
   1: sql_schema_connector::validate_migrations
           with namespaces=None
             at schema-engine\connectors\sql-schema-connector\src\lib.rs:335
   2: schema_core::state::DevDiagnostic
             at schema-engine\core\src\state.rs:276

PS F:\AI作品集\ponta\pontaponta-master> pnpm dev

> ponta-ponta@0.1.0 dev F:\AI作品集\ponta\pontaponta-master
> next dev

▲ Next.js 16.1.1 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://198.18.0.1:3000
- Environments: .env

✓ Starting...
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
✓ Ready in 897ms
 GET /register 200 in 374ms (compile: 180ms, proxy.ts: 43ms, render: 150ms)
 GET /api/auth/me 401 in 84ms (compile: 63ms, proxy.ts: 4ms, render: 17ms)
 GET / 200 in 119ms (compile: 19ms, proxy.ts: 2ms, render: 97ms)
 GET /api/auth/me 401 in 8ms (compile: 1903µs, proxy.ts: 3ms, render: 3ms)
 GET /login 200 in 40ms (compile: 22ms, proxy.ts: 3ms, render: 15ms)
登录错误: Error [PrismaClientKnownRequestError]: 
Invalid `__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].user.findUnique()` invocation in
F:\AI作品集\ponta\pontaponta-master\.next\dev\server\chunks\[root-of-the-server]__bf70cc00._.js:199:156       

  196     });
  197 }
  198 // 查询用户
→ 199 const user = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].user.findUnique(
The column `main.users.uid` does not exist in the current database.
    at <unknown> (app\api\auth\login\route.ts:24:36)
    at async POST (app\api\auth\login\route.ts:24:18)
  22 |
  23 |     // 查询用户
> 24 |     const user = await prisma.user.findUnique({
     |                                    ^
  25 |       where: { email },
  26 |     })
  27 | {
  code: 'P2022',
  clientVersion: '5.22.0',
  meta: [Object]
}
 POST /api/auth/login 500 in 144ms (compile: 40ms, proxy.ts: 6ms, render: 97ms)
登录错误: Error [PrismaClientKnownRequestError]: 
Invalid `__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].user.findUnique()` invocation in
F:\AI作品集\ponta\pontaponta-master\.next\dev\server\chunks\[root-of-the-server]__bf70cc00._.js:199:156       

  196     });
  197 }
  198 // 查询用户
→ 199 const user = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].user.findUnique(
The column `main.users.uid` does not exist in the current database.
    at <unknown> (app\api\auth\login\route.ts:24:36)
    at async POST (app\api\auth\login\route.ts:24:18)
  22 |
  23 |     // 查询用户
> 24 |     const user = await prisma.user.findUnique({
     |                                    ^
  25 |       where: { email },
  26 |     })
  27 | {
  code: 'P2022',
  clientVersion: '5.22.0',
  meta: [Object]
}
 POST /api/auth/login 500 in 51ms (compile: 3ms, proxy.ts: 4ms, render: 44ms)
PS F:\AI作品集\ponta\pontaponta-master> 
                                        npx prisma migrate dev --name init_user_system
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": SQLite database "dev.db" at "file:./dev.db"

Error: P3006

Migration `20251229_add_user_system` failed to apply cleanly to the shadow database.
Error:
SQLite database error
Cannot add a UNIQUE column
   0: sql_schema_connector::flavour::sqlite::sql_schema_from_migration_history
           with _shadow_database_connection_string=None _namespaces=None
             at schema-engine\connectors\sql-schema-connector\src\flavour\sqlite.rs:344
   1: sql_schema_connector::validate_migrations
           with namespaces=None
             at schema-engine\connectors\sql-schema-connector\src\lib.rs:335
   2: schema_core::state::DevDiagnostic
             at schema-engine\core\src\state.rs:276

PS F:\AI作品集\ponta\pontaponta-master> 