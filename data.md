root@VM-12-4-ubuntu:~/pontaponta# ls -la /root/pontaponta/public/uploads/
total 1980
drwxr-xr-x 2 www-data www-data   4096 Dec 27 20:31 .
drwxr-xr-x 3 root     root       4096 Dec 27 18:54 ..
-rw-r--r-- 1 root     root      43042 Dec 27 20:35 1766835620599-x55bmuo2bls.webp
-rw-r--r-- 1 root     root     486588 Dec 27 20:35 1766835673802-volqvol167d.png
-rw-r--r-- 1 root     root     486588 Dec 27 20:35 1766835779185-s5ylhk2d7a.png
-rw-r--r-- 1 root     root     486588 Dec 27 20:35 1766835968292-evuqk9bej5.png
-rw-r--r-- 1 root     root       7716 Dec 27 20:35 1766835996075-h7gkyklc5ik.jpg
-rw-r--r-- 1 root     root       7716 Dec 27 20:35 1766836452293-wbuptvh8c2n.jpg
-rw-r--r-- 1 root     root       7716 Dec 27 20:35 1766836471427-m8n7q5netf.jpg
-rw-r--r-- 1 root     root     486588 Dec 27 20:26 1766838386883-uuf01wsp8xg.png
-rw-r--r-- 1 www-data www-data      0 Dec 27 18:54 .gitkeep
root@VM-12-4-ubuntu:~/pontaponta# ls -la /root/pontaponta/.next/standalone/public/uploads/ 2>/dev/null || echo "standalone目录不存在"
standalone目录不存在
root@VM-12-4-ubuntu:~/pontaponta# pm2 show pontaponta
 Describing process with id 0 - name pontaponta 
┌───────────────────┬──────────────────────────────────────┐
│ status            │ online                               │
│ name              │ pontaponta                           │
│ namespace         │ default                              │
│ version           │ N/A                                  │
│ restarts          │ 2                                    │
│ uptime            │ 72m                                  │
│ script path       │ /usr/bin/npm                         │
│ script args       │ start                                │
│ error log path    │ /root/.pm2/logs/pontaponta-error.log │
│ out log path      │ /root/.pm2/logs/pontaponta-out.log   │
│ pid path          │ /root/.pm2/pids/pontaponta-0.pid     │
│ interpreter       │ /usr/bin/node                        │
│ interpreter args  │ N/A                                  │
│ script id         │ 0                                    │
│ exec cwd          │ /root/pontaponta                     │
│ exec mode         │ fork_mode                            │
│ node.js version   │ 22.21.0                              │
│ node env          │ N/A                                  │
│ watch & reload    │ ✘                                    │
│ unstable restarts │ 0                                    │
│ created at        │ 2025-12-27T11:29:43.586Z             │
└───────────────────┴──────────────────────────────────────┘
 Actions available 
┌────────────────────────┐
│ km:heapdump            │
│ km:cpu:profiling:start │
│ km:cpu:profiling:stop  │
│ km:heap:sampling:start │
│ km:heap:sampling:stop  │
└────────────────────────┘
 Trigger via: pm2 trigger pontaponta <action_name>

 Code metrics value 
┌────────────────────────┬───────────┐
│ Used Heap Size         │ 9.65 MiB  │
│ Heap Usage             │ 88.99 %   │
│ Heap Size              │ 10.85 MiB │
│ Event Loop Latency p95 │ 1.37 ms   │
│ Event Loop Latency     │ 0.38 ms   │
│ Active handles         │ 5         │
│ Active requests        │ 0         │
└────────────────────────┴───────────┘
 Divergent env variables from local env 


 Add your own code metrics: http://bit.ly/code-metrics
 Use `pm2 logs pontaponta [--lines 1000]` to display logs
 Use `pm2 env 0` to display environment variables
 Use `pm2 monit` to monitor CPU and Memory usage pontaponta
root@VM-12-4-ubuntu:~/pontaponta# curl -I http://localhost:3000/uploads/1766835673802-volqvol167d.png
HTTP/1.1 404 Not Found
Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding
x-nextjs-cache: HIT
x-nextjs-prerender: 1
x-nextjs-prerender: 1
x-nextjs-stale-time: 300
X-Powered-By: Next.js
ETag: "ley70usba1749"
Content-Type: text/html; charset=utf-8
Content-Length: 9349
Date: Sat, 27 Dec 2025 12:42:55 GMT
Connection: keep-alive
Keep-Alive: timeout=5

root@VM-12-4-ubuntu:~/pontaponta# pm2 logs pontaponta --err --lines 20
[TAILING] Tailing last 20 lines for [pontaponta] process (change the value with --lines option)
/root/.pm2/logs/pontaponta-error.log last 20 lines:
0|pontapon | 激活智能体错误: Error: ACTIVATION_CODE_NOT_FOUND
0|pontapon |     at <unknown> (.next/server/chunks/[root-of-the-server]__3d612da0._.js:1:1894)
0|pontapon |     at async T (.next/server/chunks/[root-of-the-server]__3d612da0._.js:1:1766)
0|pontapon |     at async O (.next/server/chunks/[root-of-the-server]__3d612da0._.js:1:3429)
0|pontapon |     at async u (.next/server/chunks/[root-of-the-server]__3d612da0._.js:1:6722)
0|pontapon |     at async l (.next/server/chunks/[root-of-the-server]__3d612da0._.js:1:7763)
0|pontapon |     at async Module.y (.next/server/chunks/[root-of-the-server]__3d612da0._.js:1:8841)
0|pontapon | Error: Failed to find Server Action "x". This request might be from an older or newer deployment.
0|pontapon | Read more: https://nextjs.org/docs/messages/failed-to-find-server-action
0|pontapon |     at ignore-listed frames
0|pontapon | 激活智能体错误: Error: ACTIVATION_CODE_NOT_FOUND
0|pontapon |     at <unknown> (.next/server/chunks/[root-of-the-server]__3d612da0._.js:1:1894)
0|pontapon |     at async T (.next/server/chunks/[root-of-the-server]__3d612da0._.js:1:1766)
0|pontapon |     at async O (.next/server/chunks/[root-of-the-server]__3d612da0._.js:1:3429)
0|pontapon |     at async u (.next/server/chunks/[root-of-the-server]__3d612da0._.js:1:6722)
0|pontapon |     at async l (.next/server/chunks/[root-of-the-server]__3d612da0._.js:1:7763)
0|pontapon |     at async Module.y (.next/server/chunks/[root-of-the-server]__3d612da0._.js:1:8841)

