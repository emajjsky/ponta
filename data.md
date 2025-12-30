

1/1

Next.js 16.1.1
Turbopack
Build Error


Module not found: Can't resolve '@/components/ui/tabs'
./app/exchange/my/components/MyExchangeClient.tsx (7:1)

Module not found: Can't resolve '@/components/ui/tabs'
   5 | import { Button } from '@/components/ui/button'
   6 | import { Badge } from '@/components/ui/badge'
>  7 | import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   8 | import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
   9 | import { ArrowLeft, Package, Send, Check, X, Loader2, Clock } from 'lucide-react'
  10 | import Link from 'next/link'

Import map: aliased to relative './components/ui/tabs' inside of [project]/

Import trace:
  Server Component:
    ./app/exchange/my/components/MyExchangeClient.tsx
    ./app/exchange/my/page.tsx

https://nextjs.org/docs/messages/module-not-found
1
2