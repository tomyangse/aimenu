import { NextRequest } from "next/server";
import { getGeminiClient } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, lang, userLang, note } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "未提供菜品列表" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!lang) {
      return new Response(
        JSON.stringify({ error: "未提供语言代码" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 初始化 Gemini
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // 构建菜品列表文本
    const itemsText = items.map((item: any, index: number) => {
      const name = item.originalName || item.name || "";
      const price = item.price && item.price !== "暂无" ? ` (${item.price})` : "";
      return `${index + 1}. ${name}${price}`;
    }).join("\n");

    // 根据语言代码获取语言名称（用于目标语言）
    const languageNames: Record<string, string> = {
      "sv": "瑞典语",
      "en": "英语",
      "zh": "中文",
      "zh-CN": "中文",
      "fr": "法语",
      "de": "德语",
      "es": "西班牙语",
      "it": "意大利语",
      "ja": "日语",
      "ko": "韩语",
    };

    // 目标语言（菜单的原始语言）
    const targetLanguageName = languageNames[lang] || languageNames[lang.split("-")[0]] || "该语言";
    
    // 用户选择的界面语言（用于生成翻译）
    const userLanguageCode = userLang || "zh-CN";
    const userLanguageName = languageNames[userLanguageCode] || languageNames[userLanguageCode.split("-")[0]] || "中文";

    // 构建菜品列表（用于 Prompt）
    const itemsList = items.map((item: any) => {
      const name = item.originalName || item.name || "";
      return name;
    }).join("、");

    // 优化后的 Prompt：简洁的点餐传声筒
    const prompt = `你是一个极其简洁的"点餐传声筒"。

核心任务：根据用户选择的菜品和目标语言，生成一段直接给服务员看/听的陈述句。

严禁内容：
- 严禁生成任何"服务员说"或"对方回答"的内容
- 严禁任何冗余的开场白
- 只生成顾客要说的话，不要模拟对话

菜品列表：${itemsList}
${note && note.trim() ? `\n备注要求：${note.trim()}` : ""}

输出要求：
1. 目标语言脚本：用${targetLanguageName}生成简洁的陈述句，格式类似"你好，我想点这几样：[菜品列表]${note && note.trim() ? "，备注：[备注内容]" : ""}。谢谢。"（使用目标语言的地道表达，如果有备注，请自然地包含在点餐语句中）
2. 用户语言翻译：将目标语言脚本翻译成${userLanguageName}，这是给用户确认用的翻译

输出格式（严格遵循，用 --- 分隔两个部分）：
[目标语言脚本]
---
[${userLanguageName}翻译]

直接开始输出，不要有任何说明、前缀或开场白。`;

    // 使用流式传输
    const result = await model.generateContentStream(prompt);

    // 创建 ReadableStream 用于流式返回
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const stream = result.stream;

          // 遍历流式响应
          for await (const chunk of stream) {
            try {
              const chunkText = chunk.text();
              
              if (chunkText) {
                // 发送数据块，使用 SSE 格式
                const data = JSON.stringify({ chunk: chunkText });
                controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
              }
            } catch (chunkError) {
              console.warn("处理 chunk 时出错:", chunkError);
            }
          }
          // 发送结束标记
          controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
          console.error("流式传输错误:", error);
          const errorData = JSON.stringify({ 
            error: error instanceof Error ? error.message : "流式传输时出错" 
          });
          controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("生成点餐文字时出错:", error);
    return new Response(
      JSON.stringify({ error: "生成点餐文字时出错，请稍后重试" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

