import { NextRequest } from "next/server";
import { getGeminiClient } from "@/lib/gemini";

// export const runtime = "edge"; // 暂时注释掉，因为 edge runtime 可能不支持某些功能

export async function POST(req: NextRequest) {
  try {
    const { dishName, dishDescription, question, conversationHistory, userLanguage } = await req.json();

    if (!dishName || !question) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const model = getGeminiClient().getGenerativeModel({
      model: "gemini-2.5-flash-lite",
    });

    // 语言映射表
    const languageMap: Record<string, { name: string; customer: string; waiter: string; previous: string }> = {
      "zh-CN": { name: "中文", customer: "顾客", waiter: "服务员", previous: "之前的对话" },
      "en": { name: "English", customer: "Customer", waiter: "Waiter", previous: "Previous conversation" },
      "sv": { name: "Swedish", customer: "Kund", waiter: "Servitör", previous: "Tidigare konversation" },
      "es": { name: "Spanish", customer: "Cliente", waiter: "Camarero", previous: "Conversación anterior" },
      "fr": { name: "French", customer: "Client", waiter: "Serveur", previous: "Conversation précédente" },
      "de": { name: "German", customer: "Kunde", waiter: "Kellner", previous: "Vorherige Unterhaltung" },
      "it": { name: "Italian", customer: "Cliente", waiter: "Cameriere", previous: "Conversazione precedente" },
      "ja": { name: "Japanese", customer: "お客様", waiter: "店員", previous: "以前の会話" },
      "ko": { name: "Korean", customer: "고객", waiter: "직원", previous: "이전 대화" },
    };

    const lang = languageMap[userLanguage] || languageMap["zh-CN"];

    // 构建对话历史上下文
    let historyContext = "";
    if (conversationHistory && conversationHistory.length > 0) {
      historyContext = `\n\n${lang.previous}：\n`;
      conversationHistory.forEach((msg: { role: string; content: string }) => {
        historyContext += `${msg.role === "user" ? lang.customer : lang.waiter}: ${msg.content}\n`;
      });
    }

    // 构建系统提示词（使用用户选择的语言）
    const systemPrompt = `你是一位专业、友好的餐厅服务员，正在帮助顾客了解菜单上的菜品。

当前菜品信息：
- 菜品名称：${dishName}
${dishDescription ? `- 菜品描述：${dishDescription}` : ""}

${historyContext}

请根据菜品信息回答顾客的问题。回答要求：
1. 简洁明了，直接回答顾客的问题
2. 如果菜单信息中没有明确说明，可以基于菜品名称和描述进行合理推测，但要说明这是推测
3. 语气友好、专业，就像真正的服务员一样
4. 如果确实无法确定，诚实告知
5. 回答使用${lang.name}

顾客问题：${question}

请直接回答，不要包含"服务员说"等前缀，直接给出答案：`;

    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
    });

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in ask-dish API:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate answer" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

