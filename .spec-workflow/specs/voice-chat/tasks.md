# Tasks Document - 智能体语音对话功能

> **分支策略:** 所有开发在`voice`分支进行，完成后合并到`master`
> **测试要求:** 每个阶段完成后本地测试通过，确保不破坏现有功能
> **文档引用:** Requirements (requirements.md) | Design (design.md)

---

## Phase 1: 基础设施准备 (Foundation)

### Task 1.1: 安装必要的依赖包

- **File:** `package.json` (修改)
- **Description:** 添加语音处理所需的npm包
- **Packages:**
  - `axios` - HTTP客户端（调用火山引擎API）
  - `form-data` - multipart/form-data上传（录音文件）
  - `uuid` - 生成唯一请求ID
- **Purpose:** 确保项目具备语音服务的HTTP请求和文件处理能力
- **Requirements:** 基础设施准备
- **Install Command:**
  ```bash
  pnpm add axios form-data uuid
  pnpm add -D @types/uuid
  ```
- **Success:** 依赖安装成功，`pnpm install`无错误

---

### Task 1.2: 配置火山引擎环境变量

- **File:** `.env` (修改)
- **Description:** 确认火山引擎API配置已正确设置
- **Variables:**
  ```env
  VOLCENGINE_APP_ID=6500723094
  VOLCENGINE_ACCESS_KEY_ID=c0CfuUGCqJMEw8QD53pdiTmwcLAA6Ki_
  VOLCENGINE_SECRET_ACCESS_KEY=vUfTeTEM4_-O-v3wPRlaKqtOSEp6tLCG
  ```
- **Purpose:** 提供语音服务所需的API凭证
- **Requirements:** 环境配置
- **Verification:** 运行`echo $VOLCENGINE_APP_ID`确认变量已加载
- **Success:** 环境变量正确加载到`process.env`

---

## Phase 2: 服务层实现 (Backend Services)

### Task 2.1: 创建火山引擎认证模块

- **File:** `lib/volcengine/auth.ts` (新建)
- **Description:** 实现火山引擎API签名算法（HMAC-SHA1）
- **Code Structure:**
  ```typescript
  import crypto from 'crypto'

  export interface VolcEngineConfig {
    appId: string
    accessKeyId: string
    secretAccessKey: string
  }

  export function signRequest(
    config: VolcEngineConfig,
    method: string,
    uri: string,
    query: Record<string, string> = {},
    headers: Record<string, string> = {}
  ): string
  ```
- **Purpose:** 为所有火山引擎API请求提供签名认证
- **Requirements:** API安全认证
- **Dependencies:** Node.js内置`crypto`模块
- **Test:** 使用官方文档示例验证签名算法正确性
- **Success:** 生成的签名与火山引擎工具一致

---

### Task 2.2: 创建火山引擎类型定义

- **File:** `lib/volcengine/types.ts` (新建)
- **Description:** 定义火山引擎API的TypeScript接口
- **Interfaces:**
  ```typescript
  // ASR (语音识别)
  export interface ASRRequest {
    audioFormat: 'pcm' | 'wav' | 'opus'
    sampleRate: 16000 | 8000
    language: 'zh-CN' | 'en-US'
    audioData: Buffer | ArrayBuffer
  }

  export interface ASRResponse {
    requestId: string
    text: string
    isFinal: boolean
  }

  // TTS (语音合成)
  export interface TTSRequest {
    text: string
    voiceType?: string
    speed?: number
    volume?: number
    format?: 'mp3' | 'wav' | 'opus'
  }

  export interface TTSResponse {
    audioData: Buffer
    format: string
    duration: number
  }
  ```
- **Purpose:** 提供类型安全，避免运行时错误
- **Requirements:** TypeScript类型定义
- **Success:** 所有接口编译无错误

---

### Task 2.3: 实现语音识别服务（ASR）

- **File:** `lib/volcengine/asr.ts` (新建)
- **Description:** 封装火山引擎流式语音识别API
- **Key Methods:**
  ```typescript
  export class VolcEngineASR {
    constructor(config: VolcEngineConfig)

    async recognize(audioBuffer: ArrayBuffer, options?: {
      format?: 'pcm' | 'wav'
      sampleRate?: number
      language?: 'zh-CN'
    }): Promise<string>

    private async sendToVolcEngine(
      audioData: Buffer
    ): Promise<ASRResponse>

    private convertAudioToPCM(buffer: ArrayBuffer): Promise<Buffer>
  }
  ```
- **API Endpoint:** `https://openspeech.bytedance.com/api/v2/asr`
- **Purpose:** 将用户录音转换为文字
- **Requirements:** 语音输入功能
- **Dependencies:** `lib/volcengine/auth.ts`, `axios`
- **Test:** 上传测试音频文件，验证识别准确性
- **Success:** 成功识别普通话语音并返回文字

---

### Task 2.4: 实现语音合成服务（TTS）

- **File:** `lib/volcengine/tts.ts` (新建)
- **Description:** 封装火山引擎流式语音合成API
- **Key Methods:**
  ```typescript
  export class VolcEngineTTS {
    constructor(config: VolcEngineConfig)

    async synthesize(text: string, options?: {
      voiceType?: string
      speed?: number
      volume?: number
      format?: 'mp3'
    }): Promise<Buffer>

    private async sendToVolcEngine(
      text: string,
      options: TTSRequest
    ): Promise<TTSResponse>
  }
  ```
- **API Endpoint:** `https://openspeech.bytedance.com/api/v1/tts`
- **Default Voice:** `zh_female_shuangkuaisisi_moon_bigtts`（女声）
- **Purpose:** 将AI文字回复转换为语音
- **Requirements:** 语音输出功能
- **Dependencies:** `lib/volcengine/auth.ts`, `axios`
- **Test:** 合成测试文本，验证音频质量
- **Success:** 成功生成MP3音频文件并可播放

---

### Task 2.5: 创建语音识别API端点

- **File:** `app/api/voice/asr/route.ts` (新建)
- **Description:** Next.js API路由，处理语音识别请求
- **Request Format:**
  ```typescript
  POST /api/voice/asr
  Content-Type: multipart/form-data

  Body: {
    audio: File (音频文件)
    format?: 'pcm' | 'wav'
    sampleRate?: 16000
  }
  ```
- **Response Format:**
  ```typescript
  {
    success: true,
    text: "识别到的文字",
    confidence: 0.95
  }
  ```
- **Auth:** JWT Token验证（复用现有逻辑）
- **Purpose:** 前端通过此API调用ASR服务
- **Requirements:** API端点设计
- **Dependencies:** `lib/volcengine/asr.ts`, `lib/jwt.ts`
- **Error Handling:**
  - 401: 未登录
  - 400: 音频文件格式错误
  - 500: ASR服务错误
- **Success:** Postman测试成功返回识别文字

---

### Task 2.6: 创建语音合成API端点

- **File:** `app/api/voice/tts/route.ts` (新建)
- **Description:** Next.js API路由，处理语音合成请求
- **Request Format:**
  ```typescript
  POST /api/voice/tts
  Content-Type: application/json

  Body: {
    text: "要合成的文字",
    voiceType?: "音色ID",
    speed?: 1.0,
    volume?: 80
  }
  ```
- **Response Format:**
  ```typescript
  Content-Type: audio/mpeg

  Body: <音频二进制数据>
  ```
- **Auth:** JWT Token验证（复用现有逻辑）
- **Purpose:** 前端通过此API调用TTS服务
- **Requirements:** API端点设计
- **Dependencies:** `lib/volcengine/tts.ts`, `lib/jwt.ts`
- **Error Handling:**
  - 401: 未登录
  - 400: 文字为空或超长
  - 500: TTS服务错误
- **Success:** Postman测试成功返回音频文件

---

## Phase 3: 前端组件实现 (Frontend Components)

### Task 3.1: 创建useVoiceRecorder Hook

- **File:** `hooks/useVoiceRecorder.ts` (新建)
- **Description:** 封装录音逻辑（MediaRecorder API）
- **Interface:**
  ```typescript
  interface UseVoiceRecorderReturn {
    isRecording: boolean
    duration: number
    audioLevel: number
    startRecording: () => Promise<void>
    stopRecording: () => Promise<ArrayBuffer>
    cancelRecording: () => void
    error: Error | null
  }

  export function useVoiceRecorder(options?: {
    maxDuration?: number
    onDurationUpdate?: (duration: number) => void
  }): UseVoiceRecorderReturn
  ```
- **Features:**
  - 请求麦克风权限
  - 实时音量检测（AnalyserNode）
  - 录音时长计时
  - 自动停止（超时保护）
- **Purpose:** 提供可复用的录音逻辑
- **Requirements:** 录音功能封装
- **Dependencies:** 浏览器MediaRecorder API
- **Test:** 在控制台测试录音开始/停止/音量检测
- **Success:** 成功录制10秒音频并导出ArrayBuffer

---

### Task 3.2: 创建useVoicePlayer Hook

- **File:** `hooks/useVoicePlayer.ts` (新建)
- **Description:** 封装音频播放逻辑
- **Interface:**
  ```typescript
  interface UseVoicePlayerReturn {
    isPlaying: boolean
    isLoading: boolean
    duration: number
    currentTime: number
    play: (audioData: ArrayBuffer) => Promise<void>
    pause: () => void
    stop: () => void
    seek: (time: number) => void
  }

  export function useVoicePlayer(): UseVoicePlayerReturn
  ```
- **Features:**
  - 加载和播放ArrayBuffer音频
  - 播放控制（播放/暂停/停止/跳转）
  - 播放进度更新
  - 音频格式转换（MP3 → WAV如需要）
- **Purpose:** 提供可复用的播放逻辑
- **Requirements:** 播放功能封装
- **Dependencies:** 浏览器Audio API
- **Test:** 播放测试音频文件，验证控制功能
- **Success:** 成功播放MP3音频并提供完整控制

---

### Task 3.3: 创建VoiceRecorder组件

- **File:** `components/chat/VoiceRecorder.tsx` (新建)
- **Description:** 录音UI组件，显示录音状态和动画
- **UI Elements:**
  - 麦克风按钮（开始/停止录音）
  - 录音时长显示（00:00 / 01:00）
  - 音量波形动画
  - 取消按钮（X）
- **Interaction:**
  - 点击麦克风 → 请求权限 → 开始录音 → 显示动画
  - 录音中 → 显示时长和音量 → 再次点击停止
  - 停止后 → 调用ASR API → 显示加载状态
  - 识别成功 → 触发`onTextRecognized(text)`
  - 识别失败 → 显示错误Toast
- **Props:**
  ```typescript
  interface VoiceRecorderProps {
    onTextRecognized: (text: string) => void
    onError?: (error: Error) => void
    maxDuration?: number
  }
  ```
- **Purpose:** 提供用户友好的录音界面
- **Requirements:** 录音UI组件
- **Dependencies:** `hooks/useVoiceRecorder.ts`, `app/api/voice/asr/route.ts`
- **Test:** 点击麦克风 → 录音5秒 → 停止 → 验证文字识别
- **Success:** 录音流程完整可用，UI交互流畅

---

### Task 3.4: 创建VoicePlayer组件

- **File:** `components/chat/VoicePlayer.tsx` (新建)
- **Description:** 播放UI组件，显示播放控制和进度
- **UI Elements:**
  - 播放/暂停按钮
  - 进度条（Slider）
  - 时长显示（00:30 / 01:15）
  - 音速控制（1.0x / 1.5x / 2.0x）
- **Interaction:**
  - 点击播放按钮 → 调用TTS API → 播放音频
  - 播放中 → 显示进度条 → 支持拖动跳转
  - 播放完成 → 触发`onPlayEnd()`
  - TTS失败 → 显示文字内容
- **Props:**
  ```typescript
  interface VoicePlayerProps {
    text: string
    autoPlay?: boolean
    onPlayEnd?: () => void
  }
  ```
- **Purpose:** 提供用户友好的播放界面
- **Requirements:** 播放UI组件
- **Dependencies:** `hooks/useVoicePlayer.ts`, `app/api/voice/tts/route.ts`
- **Test:** 输入测试文字 → 点击播放 → 验证音频播放
- **Success:** 播放流程完整可用，UI交互流畅

---

### Task 3.5: 创建VoiceCallButton组件

- **File:** `components/chat/VoiceCallButton.tsx` (新建)
- **Description:** 端到端通话模式开关
- **UI Elements:**
  - 通话按钮（电话图标）
  - 通话时长显示（通话中）
  - 状态指示器（脉冲动画）
- **Interaction:**
  - 点击 → 开启通话模式 → 自动打开麦克风
  - 通话中 → 检测语音 → 自动识别 → 发送 → AI回复 → 自动播放
  - 再次点击 → 结束通话 → 关闭麦克风
- **Props:**
  ```typescript
  interface VoiceCallButtonProps {
    agentSlug: string
    conversationId: string
    sendMessage: (message: string) => Promise<void>
  }
  ```
- **Logic:**
  - 使用语音检测算法（VAD - Voice Activity Detection）
  - 说话结束后自动触发识别和发送
  - AI回复后自动触发TTS和播放
  - 循环直到通话结束
- **Purpose:** 提供无缝的语音对话体验
- **Requirements:** 端到端语音通话
- **Dependencies:** `hooks/useVoiceRecorder.ts`, `hooks/useVoicePlayer.ts`
- **Test:** 开启通话 → 说"你好" → 自动发送 → 听到AI回复
- **Success:** 通话循环完整可用，延迟<5秒

---

## Phase 4: 集成和UI优化 (Integration & UI)

### Task 4.1: 扩展ChatInterface组件

- **File:** `components/chat/ChatInterface.tsx` (修改)
- **Description:** 在现有聊天界面添加语音控制按钮
- **Changes:**
  - 在输入框右侧添加麦克风按钮
  - 在顶部添加通话按钮
  - 每条AI消息添加"播放语音"按钮
  - 保留所有现有功能（文字输入、图片上传）
- **Layout:**
  ```
  ┌────────────────────────────────────────┐
  │  [消息列表]                             │
  │  - User: 你好                          │
  │    AI: [播放语音] 你好呀！我是AI助手  │
  ├────────────────────────────────────────┤
  │ [通话按钮] [输入框] [麦克风] [图片] [发送] │
  └────────────────────────────────────────┘
  ```
- **Purpose:** 将语音功能集成到主界面
- **Requirements:** UI集成
- **Dependencies:** `VoiceRecorder`, `VoicePlayer`, `VoiceCallButton`
- **Test:** 验证所有功能组合使用（文字+语音+图片）
- **Success:** 语音功能与现有功能无冲突

---

### Task 4.2: 添加用户偏好设置

- **File:** `app/profile/edit/page.tsx` (修改)
- **Description:** 添加语音功能相关设置
- **Settings:**
  - 启用语音输入（默认：开启）
  - 自动播放语音（默认：关闭）
  - 默认音色选择（下拉菜单）
  - 语音语速（滑块：0.5x - 2.0x）
  - 语音音量（滑块：0 - 100）
- **Storage:** 保存到`User`表的`preferences`字段（JSON）
- **Purpose:** 允许用户自定义语音体验
- **Requirements:** 用户设置
- **API Endpoints:** 复用`/api/user/profile`（更新preferences字段）
- **Test:** 修改设置 → 验证语音功能使用新设置
- **Success:** 设置持久化并正确应用

---

### Task 4.3: 实现错误边界和降级

- **File:** `components/chat/VoiceErrorBoundary.tsx` (新建)
- **Description:** 捕获语音功能错误，优雅降级
- **Error Scenarios:**
  - 麦克风权限拒绝 → 显示引导提示
  - 浏览器不支持Web Audio API → 隐藏语音按钮
  - API调用失败 → 显示Toast，降级为文字模式
  - 网络断开 → 缓存录音，提示稍后重试
- **UI Feedback:**
  ```typescript
  <FallbackUI>
    {error.name === 'NotAllowedError' && (
      <PermissionGuide />
    )}
    {error.name === 'APIError' && (
      <Toast>语音服务暂时不可用，请使用文字输入</Toast>
    )}
  </FallbackUI>
  ```
- **Purpose:** 确保任何情况下都能正常对话
- **Requirements:** 错误处理
- **Test:** 模拟各种错误场景，验证降级逻辑
- **Success:** 所有错误都有友好提示和降级方案

---

## Phase 5: 测试和优化 (Testing & Optimization)

### Task 5.1: 单元测试

- **Files:** `__tests__/lib/volcengine/*.test.ts` (新建)
- **Description:** 测试服务层核心逻辑
- **Test Cases:**
  1. `auth.test.ts` - 验证签名算法
  2. `asr.test.ts` - Mock HTTP请求，验证参数构建
  3. `tts.test.ts` - Mock HTTP请求，验证音频格式转换
  4. `useVoiceRecorder.test.ts` - 测试录音状态管理
  5. `useVoicePlayer.test.ts` - 测试播放控制逻辑
- **Framework:** Jest + React Testing Library
- **Coverage Target:** >80%
- **Purpose:** 确保核心逻辑正确性
- **Requirements:** 单元测试
- **Success:** 所有测试通过，覆盖率达标

---

### Task 5.2: 集成测试

- **Files:** `__tests__/integration/voice-flow.test.ts` (新建)
- **Description:** 测试完整语音对话流程
- **Test Scenarios:**
  1. 录音 → ASR → 识别文字
  2. 文字 → TTS → 播放音频
  3. 端到端通话循环
  4. 错误恢复（API失败降级）
- **Framework:** MSW (Mock Service Worker)
- **Purpose:** 验证模块间协作正确
- **Requirements:** 集成测试
- **Success:** 所有集成测试通过

---

### Task 5.3: E2E测试

- **Files:** `__tests__/e2e/voice-chat.spec.ts` (新建)
- **Description:** 测试真实用户场景
- **Test Scenarios:**
  1. 用户点击麦克风 → 说话 → 听到AI回复
  2. 用户开启通话 → 对话 → 结束通话
  3. 修改设置 → 验证新设置生效
  4. 拒绝麦克风权限 → 验证引导提示
- **Framework:** Playwright
- **Purpose:** 验证端到端用户体验
- **Requirements:** E2E测试
- **Success:** 所有关键用户场景测试通过

---

### Task 5.4: 性能优化

- **Files:** `lib/volcengine/asr.ts`, `lib/volcengine/tts.ts` (优化)
- **Description:** 优化API响应时间和资源使用
- **Optimizations:**
  1. **WebWorker处理录音** - 避免阻塞UI线程
  2. **TTS结果缓存** - 相同文本复用音频（LRU Cache）
  3. **流式TTS** - 边生成边播放（火山引擎支持）
  4. **音频压缩** - 使用Opus格式（比MP3小50%）
  5. **请求节流** - 避免频繁API调用（Debounce）
  6. **懒加载** - 语音组件按需加载
- **Metrics:**
  - ASR延迟 < 2秒
  - TTS延迟 < 1秒
  - 端到端延迟 < 5秒
  - 内存占用 < 100MB
- **Purpose:** 提升用户体验和性能
- **Requirements:** 性能优化
- **Success:** 性能指标全部达标

---

### Task 5.5: 浏览器兼容性测试

- **Browsers:** Chrome 80+, Safari 13+, Edge 80+, Firefox 75+
- **Description:** 测试不同浏览器下的语音功能
- **Test Cases:**
  - 麦克风权限请求
  - MediaRecorder兼容性
  - Audio API兼容性
  - WebWorker支持
- **Fallback:**
  - Safari不支持某些格式 → 降级到WAV
  - 旧版浏览器不支持Web Audio API → 隐藏语音功能
- **Purpose:** 确保主流浏览器都能使用
- **Requirements:** 兼容性测试
- **Success:** 所有目标浏览器功能正常

---

## Phase 6: 部署和文档 (Deployment & Documentation)

### Task 6.1: 更新环境变量文档

- **File:** `CLAUDE.md` (修改)
- **Description:** 添加语音服务配置说明
- **Content:**
  ```markdown
  ### 语音服务配置

  火山引擎语音服务（豆包同款）：
  - VOLCENGINE_APP_ID - 应用ID
  - VOLCENGINE_ACCESS_KEY_ID - 访问密钥ID
  - VOLCENGINE_SECRET_ACCESS_KEY - 密钥

  获取方式：
  1. 注册火山引擎账号
  2. 开通语音识别和语音合成服务
  3. 在控制台获取API密钥
  ```
- **Purpose:** 帮助其他开发者配置语音服务
- **Requirements:** 文档更新
- **Success:** 文档清晰易懂，配置步骤完整

---

### Task 6.2: 更新CLAUDE.md功能说明

- **File:** `CLAUDE.md` (修改)
- **Section:** "项目特定功能"（新增）
- **Content:**
  ```markdown
  ### 语音对话功能

  **功能概述:**
  - 语音输入（STT）- 火山引擎流式语音识别
  - 语音输出（TTS）- 火山引擎语音合成
  - 端到端语音通话 - 自动识别+播放循环

  **使用方法:**
  1. 点击麦克风按钮开始录音
  2. 再次点击停止，系统自动识别
  3. 点击"播放语音"按钮听AI回复
  4. 或点击"语音通话"按钮开启免提对话

  **技术实现:**
  - lib/volcengine/ - 火山引擎SDK封装
  - components/chat/VoiceRecorder.tsx - 录音组件
  - components/chat/VoicePlayer.tsx - 播放组件
  - app/api/voice/ - 语音API端点

  **注意事项:**
  - 需要麦克风权限
  - 首次使用需授权浏览器访问麦克风
  - 语音功能可与现有文字、图片功能无缝切换
  ```
- **Purpose:** 记录语音功能架构和使用方法
- **Requirements:** 文档更新
- **Success:** 文档完整，便于维护

---

### Task 6.3: 本地测试验证

- **Description:** 在本地环境完整测试语音功能
- **Checklist:**
  - [ ] 启动开发服务器（`pnpm dev`）
  - [ ] 测试语音输入（录音→识别→发送）
  - [ ] 测试语音输出（AI回复→TTS→播放）
  - [ ] 测试端到端通话（完整循环）
  - [ ] 测试Coze智能体语音功能
  - [ ] 测试OpenAI智能体语音功能
  - [ ] 测试错误处理（权限拒绝、API失败）
  - [ ] 测试用户设置（音色、语速、音量）
  - [ ] 验证现有功能未被破坏（文字对话、图片上传）
  - [ ] 性能测试（延迟、内存占用）
- **Purpose:** 确保所有功能在本地环境正常工作
- **Requirements:** 本地测试
- **Success:** 所有Checklist项通过

---

### Task 6.4: 创建Git Commit和推送

- **Branch:** `voice` (当前)
- **Description:** 提交所有语音功能代码
- **Commit Message:**
  ```bash
  feat: 集成火山引擎语音能力，支持语音输入/输出/端到端通话

  功能特性:
  - 语音输入（STT）: 流式语音识别，支持中英文
  - 语音输出（TTS）: 多音色语音合成，可调节语速音量
  - 端到端通话: 自动语音识别+播放循环，免提对话
  - 用户设置: 音色选择、语速调节、自动播放开关

  技术实现:
  - lib/volcengine/: 火山引擎SDK封装（ASR/TTS/Auth）
  - components/chat/: 录音/播放/通话UI组件
  - hooks/: useVoiceRecorder/useVoicePlayer/useVoiceCall
  - app/api/voice/: 语音API端点

  兼容性:
  - 支持Coze和OpenAI Compatible两种Provider
  - 不破坏现有文字对话和图片上传功能
  - 浏览器兼容: Chrome 80+, Safari 13+, Edge 80+

  文档更新:
  - CLAUDE.md: 添加语音功能说明
  - .spec-workflow/specs/voice-chat/: 完整规格文档

  Closes #[issue_number]
  ```
- **Push Command:**
  ```bash
  git add .
  git commit -m "feat: 集成火山引擎语音能力"
  git push origin voice
  ```
- **Purpose:** 将代码推送到GitHub，准备合并
- **Requirements:** Git提交
- **Success:** 代码成功推送到voice分支

---

### Task 6.5: 创建Pull Request

- **Platform:** GitHub
- **Title:** "feat: 集成火山引擎语音能力"
- **Description:**
  ```markdown
  ## 功能概述
  为智能体对话系统添加完整的语音交互能力，包括语音输入、语音输出和端到端语音通话。

  ## 主要变更
  - 🔧 新增火山引擎语音服务层（ASR/TTS）
  - 🎤 新增语音录音组件（VoiceRecorder）
  - 🔊 新增语音播放组件（VoicePlayer）
  - 📞 新增端到端通话功能（VoiceCallButton）
  - ⚙️ 新增用户语音偏好设置
  - 📝 完整的规格文档（Requirements/Design/Tasks）

  ## 测试清单
  - [x] 本地测试通过
  - [x] 单元测试覆盖 >80%
  - [x] 现有功能无冲突
  - [x] 浏览器兼容性验证
  - [x] 性能指标达标

  ## 部署注意事项
  需要在服务器环境配置以下环境变量:
  - VOLCENGINE_APP_ID
  - VOLCENGINE_ACCESS_KEY_ID
  - VOLCENGINE_SECRET_ACCESS_KEY

  ## 相关文档
  - Specs: `.spec-workflow/specs/voice-chat/`
  - Demo Video: (可选)

  @cc @reviewer
  ```
- **Purpose:** 请求代码审查和合并
- **Requirements:** Pull Request
- **Success:** PR创建成功，等待审查

---

## Phase 7: 合并和部署 (Merge & Deploy)

### Task 7.1: 代码审查和修复

- **Reviewers:** 项目负责人或资深开发者
- **Checklist:**
  - [ ] 代码符合项目规范（TypeScript、React Hooks、命名约定）
  - [ ] 所有函数有清晰的注释
  - [ ] 错误处理完善
  - [ ] 性能优化到位
  - [ ] 测试覆盖充分
  - [ ] 文档完整准确
- **Feedback:** 根据审查意见修改代码
- **Purpose:** 确保代码质量和可维护性
- **Requirements:** 代码审查
- **Success:** 审查通过，批准合并

---

### Task 7.2: 合并到master分支

- **Strategy:** Squash and merge（合并所有commits为一个）
- **Command:**
  ```bash
  git checkout master
  git pull origin master
  git merge voice --squash
  git commit -m "feat: 集成火山引擎语音能力，支持语音输入/输出/端到端通话"
  git push origin master
  ```
- **Post-Merge:**
  - 删除voice分支（可选）
  - 更新CHANGELOG.md
  - 打Tag（v1.1.0-voice）
- **Purpose:** 将语音功能发布到生产环境
- **Requirements:** 分支合并
- **Success:** 代码成功合并到master

---

### Task 7.3: 服务器部署

- **Server:** 腾讯云（生产环境）
- **Steps:**
  1. **拉取最新代码**
     ```bash
     cd ~/ponta
     git pull origin master
     ```

  2. **配置环境变量**
     ```bash
     nano .env
     # 添加以下配置（如果尚未配置）
     VOLCENGINE_APP_ID=6500723094
     VOLCENGINE_ACCESS_KEY_ID=c0CfuUGCqJMEw8QD53pdiTmwcLAA6Ki_
     VOLCENGINE_SECRET_ACCESS_KEY=vUfTeTEM4_-O-v3wPRlaKqtOSEp6tLCG
     ```

  3. **安装依赖**
     ```bash
     pnpm install
     ```

  4. **重新构建**
     ```bash
     pnpm build
     ```

  5. **重启PM2**
     ```bash
     pm2 restart ponta
     ```

  6. **验证部署**
     ```bash
     pm2 logs ponta --lines 50
     ```
- **Purpose:** 将语音功能部署到生产环境
- **Requirements:** 服务器部署
- **Success:** 生产环境语音功能正常工作

---

### Task 7.4: 生产环境验证

- **Checklist:**
  - [ ] 访问生产环境网站
  - [ ] 测试语音输入（麦克风→识别→发送）
  - [ ] 测试语音输出（AI回复→播放）
  - [ ] 测试端到端通话
  - [ ] 测试不同浏览器（Chrome/Safari/Mobile）
  - [ ] 检查API日志（确认无报错）
  - [ ] 监控性能指标（延迟、成功率）
  - [ ] 验证现有功能正常（文字、图片）
- **Rollback Plan:** 如果发现严重问题，立即回滚到上一个版本
  ```bash
  git revert HEAD
  pnpm build && pm2 restart ponta
  ```
- **Purpose:** 确保生产环境稳定运行
- **Requirements:** 生产验证
- **Success:** 所有验证项通过，无用户投诉

---

## 总结

**总任务数:** 35个
**预计工时:** 20-30小时
**优先级:** P0（核心功能）

**关键里程碑:**
- ✅ Phase 1-2: 服务层完成（Day 1-2）
- ✅ Phase 3: 前端组件完成（Day 3-4）
- ✅ Phase 4: 集成和优化完成（Day 5）
- ✅ Phase 5-6: 测试和文档完成（Day 6）
- ✅ Phase 7: 部署和上线（Day 7）

**风险和缓解:**
- **风险:** 火山引擎API限流或计费问题
  - **缓解:** 添加请求频率限制和监控告警
- **风险:** 浏览器兼容性问题
  - **缓解:** 充分测试，提供降级方案
- **风险:** 性能问题（延迟高、内存占用大）
  - **缓解:** WebWorker处理、音频缓存、流式处理

**成功标准:**
- 所有测试通过（单元/集成/E2E）
- 性能指标达标（ASR<2s, TTS<1s, E2E<5s）
- 浏览器兼容性良好（Chrome/Safari/Edge）
- 生产环境稳定运行（无P0/P1级Bug）
- 用户反馈积极（语音识别准确、播放流畅）

---

**Document Version:** 1.0
**Last Updated:** 2025-01-02
**Author:** 老王（AI开发助手）
**Status:** Ready for Implementation
