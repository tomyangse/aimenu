import { NextRequest } from "next/server";
import { getGeminiClient } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const targetLanguage = (formData.get("targetLanguage") as string) || "zh-CN"; // 获取目标语言，默认中文

    if (!file) {
      return new Response(
        JSON.stringify({ error: "未提供文件" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 语言代码到 AI 可理解名称的映射表
    const languageNameMap: Record<string, string> = {
      "zh-CN": "简体中文",
      "zh": "简体中文",
      "en": "English",
      "sv": "Swedish",
      "es": "Spanish",
      "fr": "French",
      "de": "German",
      "it": "Italian",
      "ja": "Japanese",
      "ko": "Korean",
    };

    // 获取目标语言的名称（用于 Prompt）
    const targetLanguageName = languageNameMap[targetLanguage] || languageNameMap[targetLanguage.split("-")[0]] || "简体中文";

    // 将文件转换为 base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    // 初始化 Gemini
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // 构建提示词 - 要求使用四种前缀输出专业餐厅指南格式，动态目标语言
    const prompt = `你是一个专业的菜单翻译助手。请严格按照以下协议输出内容，使用四种前缀：

0. LANG|：首先输出菜单的主要语言（ISO 639-1 语言代码，如：zh、en、sv、fr、de、es、it、ja、ko 等）
   示例：LANG| sv （表示瑞典语菜单）
   示例：LANG| en （表示英语菜单）
   示例：LANG| zh （表示中文菜单）

1. INTRO|：用于输出整个餐厅或菜单的背景介绍（如：供应时间、菜系特色、餐厅信息等）
   示例：INTRO| 这是一份 Creme de la Creme 餐厅的早餐菜单，供应至中午 12:30。

2. CAT|：用于输出分类标题（如：菜品分类、系列名称等）
   示例：CAT| 1. Flauta 系列 (长棍三明治)

3. ITEM|：用于输出具体的菜品信息，格式为：原名 | ${targetLanguageName}翻译 | 价格 | 一句话极简解读
   示例：ITEM| Flauta Ibérico | 伊比利亚火腿三明治 | 5.00€ | 经典的西班牙风味

重要说明：
- 请将以下菜单内容翻译成 ${targetLanguageName}
- 所有翻译内容（包括 INTRO|、CAT| 和 ITEM| 中的翻译部分）都应该使用 ${targetLanguageName}
- ITEM| 格式中的"翻译"字段必须是 ${targetLanguageName} 翻译

输出要求：
- 第一行必须是 LANG|，标识菜单的主要语言
- 每行必须以 LANG|、INTRO|、CAT| 或 ITEM| 开头
- INTRO| 通常只有一行，放在 LANG| 之后
- CAT| 用于分组，可以有多行
- ITEM| 是具体菜品，格式：原名 | ${targetLanguageName}翻译 | 价格 | 解读
- 如果没有价格，价格字段留空或写"暂无"
- 解读要简洁，一句话概括（口感/特色/食材），使用 ${targetLanguageName}
- 不要有任何其他格式或说明文字
- 直接开始输出，不要开场白`;

    // 使用流式传输 - generateContentStream 返回 Promise，需要 await
    const result = await model.generateContentStream([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      },
    ]);

    // 创建 ReadableStream 用于流式返回
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // result.stream 是 AsyncGenerator<EnhancedGenerateContentResponse>
          const stream = result.stream;

          // 遍历流式响应
          for await (const chunk of stream) {
            try {
              // chunk 是 EnhancedGenerateContentResponse，使用 text() 方法获取文本
              const chunkText = chunk.text();
              
              if (chunkText) {
                // 发送数据块，使用 SSE 格式
                const data = JSON.stringify({ chunk: chunkText });
                controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
              }
            } catch (chunkError) {
              // 如果单个 chunk 处理失败，继续处理下一个
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
    console.error("分析菜单时出错:", error);
    return new Response(
      JSON.stringify({ error: "分析菜单时出错，请稍后重试" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

