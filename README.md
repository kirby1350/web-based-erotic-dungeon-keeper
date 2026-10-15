# 地下城城主

你不扮演冒险者。你是这座地下城的管理者。冒险者会自己闯进来，你用陷阱、魔物和布置把他们留下来。

这个仓库从 [地下城探险模拟器](https://github.com/kirby1350/web-based-erotic-dungeon-simulator) 复制而来，沿用同一套 Next.js 16、React 19 和 AI 回合框架。开局是城主厅。玩家布置陷阱和魔物，再看随机闯进来的人撞上。

目标写在 [目标.md](./目标.md)。

## 功能

- **城主厅**：给地下城起名，看在狱里的人。淫髓用来加陷阱栏、魔物栏、深度、魔物强度和在狱格子。
- **闯入者**：开门时按词表随机生成，也可以改抽角色库或再换一个。玩家不创建、不扮演这名冒险者。格子够时可以再跟一个人，先调教前面这个，后面那个在名册上等。
- **四种开局**：亲自上手、投入陷阱、放出魔物、推进廊道。她自己走进来。收藏室再带回时是例外，人被直接传送。
- **调教**：流式剧情，每回合四个选项，选项是城主的命令。生命、快感、欲望、三围、开发度和异常状态记在闯入者身上。往里赶满了可以把她送去下一层。
- **布置**：陷阱工房和魔物工房入库预设，或让模型写一件新的，再塞进某一层。往里赶时，这一层已经布置的东西有机会绊住她。也可以花淫髓临时捏一只魔物，取出就散。
- **处置**：留下、玩坏、放走要先达到快感、欲望或开发门槛。确认后写一小段，人进收藏室。收藏室可以再调教、召回、假装放走或扔掉。
- **场景插图**：根据剧情生成 danbooru 标签，调用 PixAI / TensorArt 出图。
- **存档**：城主、闯入者和对话进度自动保存在浏览器 localStorage；支持在「设置」中导出 / 导入存档 JSON。
- **多模型**：对话模型实时从 DZMM `v2/models` 接口拉取，另支持 Grok（xAI）。

调教画面的工具菜单里还留着随机陷阱生成器和异常状态管理。生成的陷阱只填进输入框，不进工房。`character-creator.tsx` 已不挂到页面；若浏览器里还有旧的冒险者存档、而城主名册是空的，载入时会把她收进名册并直接打开那场调教。

## 快速开始

```bash
pnpm install
cp .env.example .env.local   # 填入需要的 API Key（DZMM 令牌仅在服务端配置）
pnpm dev
```

打开 http://localhost:3000 。

> 需要 **Node.js >= 20.9.0**（Next.js 16 要求）。

## 环境变量

见 [`.env.example`](./.env.example)。DZMM 令牌仅从服务端读取；其他服务仍支持在应用设置中配置 Key：

| 变量 | 用途 |
| --- | --- |
| `DZMM_API_TOKEN` | DZMM Card-Chat API v2 令牌（服务端） |
| `CHAT_API_KEY` | 兼容旧变量名，优先使用 `DZMM_API_TOKEN` |
| `GROK_API_KEY` | Grok / xAI 模型 |
| `PIXAI_API_KEY` | PixAI 图片生成 |
| `TENSORART_API_KEY` | TensorArt 图片生成 |

## 脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 本地开发 |
| `pnpm build` | 生产构建 |
| `pnpm start` | 运行生产构建 |
| `pnpm lint` | ESLint 检查 |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm test:adventure` | 状态校验、回合提交、存档、记忆与流式取消回归 |
| `pnpm test:e2e` | 隔离 Chrome 浏览器测试（全部模型/图片接口被模拟） |
| `pnpm eval:prompts` | 固定场景离线评估 |

存档导出不包含 API Key；导入存档时保留本机密钥。生产构建会执行类型检查，类型错误会阻止构建。

## 回合、恢复与记忆

行动和程序判定先保存为待完成回合，角色数值暂不改变。生成和校验成功后，角色、剧情和回合记录以一次 localStorage 写入一起提交。断网、停止或刷新后可继续相同回合，也可放弃；重试不会重掷判定或重复增加探索进度。提交前存储写入失败时不会显示为成功。

状态 JSON 必须完整并通过字段、整数范围和唯一 ID 校验。状态无效时，每次尝试最多自动请求一次仅状态修复；修复失败可继续修复，不重新生成已经完成的正文。已验证回复若在提交时遇到存储失败，可「重试保存」，不再次调用模型。旧状态在回合提交前保持不变。可选状态描述无效时沿用已有描述。

每积累10个近期已完成回合，系统尝试整理历史并保留最近4条消息。任务、人物关系、承诺和线索独立存储；记忆更新必须引用已提交回合正文，未提及的旧记录不会删除。可以在「地下城记忆」展开查看依据与来源回合。整理失败时保留原始对话。

进行中的调教仍写入 `dungeon_game_v2`，自动读取旧角色及会话数据，首次保存时迁移。城主名册、工房、地城、收藏室和淫髓另存在 `dungeon_keep`。快感比回合开始升高时加 1 点淫髓，升了 20 以上加 2 点；留下、玩坏、放走分别再给 8、16、3 点。设置中的导出/导入包含城主存档、待完成回合、记忆和最近20个回合记录；待完成回合存在时仍可导出，导入需先完成或放弃该回合。字体随依赖本地打包，构建不再请求 Google Fonts。

## 回归与版本比较

`pnpm test:e2e` 需要本机 Chrome；测试使用全新的浏览器上下文，不接触日常浏览器存档，也不调用真实模型。会自动启动本地服务，或复用3000端口上的服务。

```bash
pnpm test:adventure
pnpm test:e2e
pnpm eval:prompts --output artifacts/prompt-eval-v3.json
pnpm eval:prompts --input exported-save.json --label model-v3 --output artifacts/model-v3.json
pnpm eval:prompts --input newer-save.json --label model-v4 --compare artifacts/model-v3.json
```

无 `--input` 时运行的是刻意包含截断、状态矛盾及重复正文的人工样本，报告比例用于验证检测器，不代表模型实际质量。输入也可采用 `EvaluationCase[]` JSON（见 `lib/adventure-eval.ts`），用相同场景的不同版本模型响应进行比较。导出存档评估范围是最近已提交的20个回合，不能代表全部请求的成功率。

报告包含格式成功率、程序判定矛盾率和相邻正文重复率。重复率采用三字片段相似度，属于提示信号，需要人工判断剧情质量；不同输入样本的报告不应直接视为版本优劣。报告只输出指标与回合 ID，不复制剧情正文。提示词版本随回合记录保存。

## 部署须知（安全）

DZMM 令牌保留在服务端；其他服务的用户自填 API Key 存储在浏览器 localStorage，并随请求经由本项目的 `/api/*` 代理转发。请注意：

- 本应用面向**单人自部署**场景。`/api/chat`、`/api/image/*` 等接口**没有鉴权与速率限制**。
- 若部署到公网，他人可直接调用这些接口，消耗你配置在环境变量里的 Key。建议加访问控制（如 Vercel 的密码保护 / 中间件鉴权 / 仅本地运行）。

## 目录结构

```
app/            页面与 API 路由。page.tsx 在城主厅、门口、工房、地城、收藏室和调教之间切换
components/     keep-hall、intruder-gate、keeper-workshop、dungeon-editor、keeper-collection、game-screen、chat-panel、image-panel
lib/            keeper（城主存档与处置）、intruder-roll（随机闯入者）、prompts、chat-protocol、回合与记忆
hooks/          use-adventure-session（调教回合）、use-aftermath（处置后的短场面）
```

## 玩法说明

游戏内容为成人向虚构创作，仅供成年人在合法合规前提下娱乐使用。

### DZMM v2 接入

自部署通过服务端代理访问 `https://api.sillytraven.dev/api/ai/v2/models` 和 `/v2/chat/completions`。默认模型为 `x-apex-surge-0505-16k`。现有系统提示映射到角色卡的 `system_prompt`，普通对话放入 `messages`，响应继续使用 SSE 流式输出。配置 `.env.local` 中的 `DZMM_API_TOKEN` 后重启服务。平台 iframe 仍使用宿主注入的 SDK。
