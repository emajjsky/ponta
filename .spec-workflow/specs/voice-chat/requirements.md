# Requirements Document - 智能体语音对话功能

## Introduction

本功能旨在为PONT-PONTA平台的智能体对话系统添加语音交互能力，提供类似豆包APP的语音输入、语音输出和端到端语音通话体验。用户可以通过语音与AI智能体进行自然对话，系统使用火山引擎的语音识别（ASR）和语音合成（TTS）技术实现流畅的语音交互。

## Alignment with Product Vision

本功能完全符合PONT-PONTA"创新的AI智能体盲盒平台"的产品定位：
- **提升用户体验**：语音交互比打字更自然、更便捷
- **差异化竞争优势**：大多数智能体平台仅支持文字对话，语音能力是创新点
- **多模态交互**：在图片识别的基础上增加语音通道，打造全方位交互体验
- **符合平台定位**：实体NFC芯片+虚拟AI智能体，语音让"碰一碰"后的交互更自然

## Requirements

### Requirement 1: 语音输入（Speech-to-Text）

**User Story:** 作为用户，我想要通过语音输入消息，这样我就不用打字，可以更自然地与智能体对话

#### Acceptance Criteria

1. WHEN 用户点击麦克风按钮 THEN 系统 SHALL 请求麦克风权限并开始录音
2. WHEN 用户正在录音 THEN 系统 SHALL 显示录音动画和实时音量波形
3. WHEN 用户再次点击麦克风按钮或达到最大录音时长（60秒）THEN 系统 SHALL 停止录音
4. WHEN 录音结束后 THEN 系统 SHALL 自动调用火山引擎语音识别API将语音转换为文字
5. IF 语音识别成功 THEN 系统 SHALL 自动将识别的文字填入输入框并开始发送
6. IF 语音识别失败 THEN 系统 SHALL 显示友好错误提示（toast通知）
7. WHEN 语音识别进行中 THEN 系统 SHALL 显示"正在识别..."加载状态

### Requirement 2: 语音输出（Text-to-Speech）

**User Story:** 作为用户，我想要听到智能体的语音回复，这样我可以解放眼睛，在开车或做其他事情时也能对话

#### Acceptance Criteria

1. WHEN 智能体返回文字回复 THEN 系统 SHALL 在界面上显示"播放语音"按钮
2. WHEN 用户点击"播放语音"按钮 THEN 系统 SHALL 调用火山引擎TTS API生成语音
3. WHEN 语音生成完成后 THEN 系统 SHALL 自动播放并显示播放动画
4. WHEN 语音正在播放 THEN 系统 SHALL 显示暂停/停止按钮
5. WHEN 用户点击暂停按钮 THEN 系统 SHALL 暂停语音播放
6. WHEN 用户点击停止按钮或播放完成 THEN 系统 SHALL 停止播放并恢复"播放语音"按钮
7. IF TTS生成失败 THEN 系统 SHALL 显示错误提示并降级为文字显示
8. WHEN 语音播放结束后 THEN 系统 SHALL 自动滚动到底部并准备接收下一条消息

### Requirement 3: 端到端语音通话模式

**User Story:** 作为用户，我想要开启"语音通话"模式，这样我可以用语音对话，系统自动识别我的语音并朗读智能体的回复

#### Acceptance Criteria

1. WHEN 用户点击"语音通话"按钮 THEN 系统 SHALL 开启端到端语音模式
2. WHEN 语音通话模式激活后 THEN 系统 SHALL 自动打开麦克风并开始监听
3. WHEN 用户说话（检测到语音）THEN 系统 SHALL 实时录音并在说话结束后自动识别
4. WHEN 识别完成 THEN 系统 SHALL 自动发送消息给智能体
5. WHEN 收到智能体回复 THEN 系统 SHALL 自动将文字转换为语音并播放
6. WHEN 用户点击"结束通话"按钮 THEN 系统 SHALL 关闭麦克风并停止语音播放
7. WHEN 语音通话进行中 THEN 系统 SHALL 显示通话时长和状态动画
8. IF 任一环节失败（录音、识别、TTS、播放）THEN 系统 SHALL 显示错误但不中断通话模式

### Requirement 4: 双Provider兼容性

**User Story:** 作为系统，我需要确保语音功能同时支持Coze和OpenAI Compatible两种Provider，这样用户无论使用哪种智能体都能享受语音功能

#### Acceptance Criteria

1. WHEN 用户使用Coze智能体 THEN 系统 SHALL 正常支持语音输入和输出
2. WHEN 用户使用OpenAI兼容智能体 THEN 系统 SHALL 正常支持语音输入和输出
3. WHEN 语音识别后的文字发送给AI THEN 系统 SHALL 使用现有的chat API接口（无需修改）
4. WHEN AI返回文字回复 THEN 系统 SHALL 传递给TTS模块生成语音（不依赖AI Provider类型）

### Requirement 5: 配置和权限管理

**User Story:** 作为用户，我想要控制语音功能的开关和权限，这样我可以根据使用场景选择是否启用语音

#### Acceptance Criteria

1. WHEN 用户首次使用语音功能 THEN 系统 SHALL 请求麦克风权限（浏览器标准权限弹窗）
2. IF 用户拒绝麦克风权限 THEN 系统 SHALL 禁用语音输入功能并显示引导提示
3. WHEN 用户在设置中关闭"自动播放语音"选项 THEN 系统 SHALL 默认不播放TTS，需手动点击
4. WHEN 用户在设置中关闭"语音通话"选项 THEN 系统 SHALL 隐藏语音通话按钮
5. WHEN 用户选择语音音色 THEN 系统 SHALL 保存偏好设置并在下次TTS时应用

## Non-Functional Requirements

### Code Architecture and Modularity

**Single Responsibility Principle:**
- `lib/volcengine/` - 火山引擎API封装（STT、TTS分离）
- `components/chat/VoiceRecorder.tsx` - 语音录音组件（独立UI）
- `components/chat/VoicePlayer.tsx` - 语音播放组件（独立UI）
- `app/api/voice/` - 语音相关API端点（独立的路由）

**Modular Design:**
- 语音功能作为可选模块，不影响现有文字对话
- 提供统一的VoiceService接口，可轻松切换其他语音服务提供商
- 组件化设计，VoiceRecorder和VoicePlayer可独立复用

**Dependency Management:**
- 语音服务与AI Provider完全解耦
- 使用适配器模式统一Coze和OpenAI的语音处理
- 最小化对现有代码的修改（遵循开闭原则）

**Clear Interfaces:**
```typescript
interface IVoiceService {
  recognize(audioBuffer: ArrayBuffer): Promise<string>
  synthesize(text: string, voice?: string): Promise<ArrayBuffer>
}

interface IVoiceRecorder {
  startRecording(): Promise<void>
  stopRecording(): Promise<ArrayBuffer>
  cancelRecording(): void
}

interface IVoicePlayer {
  play(audioBuffer: ArrayBuffer): Promise<void>
  pause(): void
  stop(): void
}
```

### Performance

- **语音识别延迟:** < 2秒（从录音结束到返回文字）
- **TTS生成延迟:** < 1秒（从请求到返回音频流）
- **端到端延迟:** < 5秒（从用户说话到听到AI回复）
- **录音质量:** 16kHz采样率，单声道，PCM格式
- **音频压缩:** 使用Opus编码（比MP3更适合实时语音）

**性能优化策略:**
- 使用WebWorker处理录音和音频编码，避免阻塞UI
- TTS结果缓存（相同文本重复播放时复用）
- 流式TTS（火山引擎支持，边生成边播放）
- 防抖和节流（避免频繁请求API）

### Security

- **API密钥安全:** 火山引擎密钥存储在服务端环境变量，前端不可见
- **权限管理:** 严格遵循浏览器权限模型，不绕过用户授权
- **数据加密:** 语音数据传输使用HTTPS（火山引擎要求）
- **内容审核:** 识别后的文字经过现有安全检查机制
- **临时存储:** 录音文件仅在内存中处理，不持久化到localStorage

**防止滥用:**
- 限制单次录音时长（最大60秒）
- 限制每日语音识别次数（通过后端限流）
- 防止恶意频繁请求（前端节流+后端速率限制）

### Reliability

- **错误恢复:** API调用失败时降级为文字模式
- **网络容错:** 支持断网重连和请求重试（最多3次）
- **兼容性:** 支持现代浏览器（Chrome 80+、Safari 13+、Edge 80+）
- **降级策略:** 如果浏览器不支持Web Audio API，隐藏语音功能入口

**监控和日志:**
- 记录语音识别成功率、TTS生成成功率
- 监控API响应时间和错误率
- 错误日志上报（Sentry或类似服务）

### Usability

- **直观UI:** 麦克风按钮位置显眼（输入框右侧）
- **状态反馈:** 录音时显示波形动画，识别中显示加载状态
- **容错设计:** 识别失败后允许用户手动修改文字
- **键盘快捷键:** Space键（按住说话）、Esc键（取消录音）
- **音色选择:** 提供多种预设音色（男声/女声/童声）
- **播放控制:** 支持暂停/继续/停止/调节语速

**无障碍支持:**
- ARIA标签支持屏幕阅读器
- 键盘导航完整支持
- 高对比度模式兼容

---

**Document Version:** 1.0
**Last Updated:** 2025-01-02
**Author:** 老王（AI开发助手）
**Status:** Ready for Design Phase
