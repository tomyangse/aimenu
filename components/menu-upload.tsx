"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, X, Loader2, ShoppingCart, Check, Copy, Menu, ChevronDown, ChevronUp, Plus, Camera, Bookmark, Home, Clock, User, MessageCircle, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Header } from "@/components/header";
import { useLanguage } from "@/contexts/language-context";
import { useTranslation } from "@/lib/translations";
import { getLoadingMessages } from "@/lib/loading-messages";

// 定义菜单项类型
type MenuItemType = {
  type: "LANG" | "INTRO" | "CAT" | "ITEM";
  content: string;
  index: number;
};

// 定义已点菜品类型
type SelectedItem = {
  originalName: string;
  chineseName: string;
  price: string;
  description: string;
  index: number;
};

export default function MenuUpload() {
  const { language: userLanguage } = useLanguage(); // 从全局状态获取用户语言
  const { t } = useTranslation(); // 翻译函数
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploadCollapsed, setIsUploadCollapsed] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [menuLanguage, setMenuLanguage] = useState<string>(""); // 菜单语言标签
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [targetText, setTargetText] = useState<string>(""); // 目标语言点餐文字（给服务员看）
  const [chineseText, setChineseText] = useState<string>(""); // 用户语言翻译（给用户看）
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isGeneratingOrder, setIsGeneratingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNote, setOrderNote] = useState<string>(""); // 点餐备注
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0); // 当前加载消息索引
  const [isAskDialogOpen, setIsAskDialogOpen] = useState(false); // 询问对话框状态
  const [currentDish, setCurrentDish] = useState<{ name: string; description: string; originalName: string } | null>(null); // 当前询问的菜品
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]); // 对话历史
  const [currentQuestion, setCurrentQuestion] = useState<string>(""); // 当前输入的问题
  const [isAsking, setIsAsking] = useState(false); // 是否正在询问
  const [currentAnswer, setCurrentAnswer] = useState<string>(""); // 当前流式回答
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    // 验证文件类型
    if (!selectedFile.type.startsWith("image/")) {
      setError(t("error.invalidFile"));
      return;
    }

    // 验证文件大小（最大 10MB）
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError(t("error.fileTooLarge"));
      return;
    }

    setFile(selectedFile);
    setError(null);
    setMenuItems([]);

    // 创建预览
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    setMenuItems([]);
    setMenuLanguage("");
    setSelectedItems([]);
    setIsUploadCollapsed(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 添加菜品到购物车
  const handleAddToCart = (item: MenuItemType) => {
    if (item.type !== "ITEM") return;
    
    const parts = item.content.split("|").map(part => part.trim());
    if (parts.length >= 4) {
      const [originalName, chineseName, price, description] = parts;
      const newItem: SelectedItem = {
        originalName,
        chineseName,
        price,
        description,
        index: item.index,
      };
      setSelectedItems((prev) => [...prev, newItem]);
    }
  };

  // 从购物车移除菜品
  const handleRemoveFromCart = (index: number) => {
    setSelectedItems((prev) => prev.filter((item) => item.index !== index));
  };

  // 循环播放加载消息
  useEffect(() => {
    if (!isAnalyzing) {
      setLoadingMsgIndex(0);
      return;
    }

    const messages = getLoadingMessages(userLanguage);
    const interval = setInterval(() => {
      setLoadingMsgIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 3000); // 每3秒切换一次

    return () => {
      clearInterval(interval);
    };
  }, [isAnalyzing, userLanguage]);

  // 滚动到消息底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversationHistory, currentAnswer]);

  // 打开询问对话框
  const handleOpenAskDialog = (item: MenuItemType) => {
    const parts = item.content.split("|").map(part => part.trim());
    if (parts.length >= 4) {
      const [originalName, chineseName, price, description] = parts;
      setCurrentDish({
        name: chineseName || originalName,
        description: description || "",
        originalName: originalName,
      });
      setConversationHistory([]);
      setCurrentAnswer("");
      setCurrentQuestion("");
      setIsAskDialogOpen(true);
    }
  };

  // 发送问题
  const handleSendQuestion = async () => {
    if (!currentQuestion.trim() || !currentDish || isAsking) return;

    const question = currentQuestion.trim();
    setCurrentQuestion("");
    setIsAsking(true);
    setCurrentAnswer("");

    // 添加用户问题到对话历史（先添加到历史中，这样API可以获取到）
    const userMessage = { role: "user" as const, content: question };
    const updatedHistory = [...conversationHistory, userMessage];
    setConversationHistory(updatedHistory);

    try {
      const response = await fetch("/api/ask-dish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dishName: currentDish.originalName,
          dishDescription: currentDish.description,
          question: question,
          conversationHistory: conversationHistory, // 传递之前的完整历史，不包含当前问题
          userLanguage: userLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get answer");
      }

      if (!response.body) {
        throw new Error("Response body is empty");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";
      let answer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const sseLines = sseBuffer.split("\n\n");
        sseBuffer = sseLines.pop() || "";

        for (const sseLine of sseLines) {
          if (sseLine.startsWith("data: ")) {
            const data = sseLine.slice(6);
            if (data === "[DONE]") {
              // 流式输出完成，添加到对话历史
              setConversationHistory((prev) => [
                ...prev,
                { role: "assistant", content: answer },
              ]);
              setCurrentAnswer("");
              setIsAsking(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                answer += parsed.text;
                setCurrentAnswer(answer);
              }
            } catch (e) {
              // 忽略解析错误
              console.warn("Failed to parse SSE data:", e);
            }
          }
        }
      }

      // 处理剩余的缓冲区
      if (sseBuffer.trim()) {
        const remainingLines = sseBuffer.split("\n\n");
        for (const sseLine of remainingLines) {
          if (sseLine.startsWith("data: ")) {
            const data = sseLine.slice(6);
            if (data === "[DONE]") {
              setConversationHistory((prev) => [
                ...prev,
                { role: "assistant", content: answer },
              ]);
              setCurrentAnswer("");
              setIsAsking(false);
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                answer += parsed.text;
                setCurrentAnswer(answer);
              }
            } catch (e) {
              console.warn("Failed to parse remaining SSE data:", e);
            }
          }
        }
      }

      // 如果流正常结束，添加最终答案
      if (answer) {
        setConversationHistory((prev) => [
          ...prev,
          { role: "assistant", content: answer },
        ]);
      }
      setCurrentAnswer("");
      setIsAsking(false);
    } catch (error) {
      console.error("Error asking question:", error);
      setConversationHistory((prev) => [
        ...prev,
        { role: "assistant", content: t("ask.error") || "抱歉，无法获取回答，请稍后重试。" },
      ]);
      setIsAsking(false);
    }
  };

  // 确认点餐 - 调用 API 生成自然的点餐文字（流式）
  const handleConfirmOrder = async () => {
    if (selectedItems.length === 0) return;
    
    setIsGeneratingOrder(true);
    setIsCartOpen(false);
    setTargetText("");
    setChineseText("");
    setIsOrderDialogOpen(true);
    
    try {
      const response = await fetch("/api/generate-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: selectedItems.map(item => ({
            originalName: item.originalName,
            name: item.originalName,
            price: item.price,
          })),
          lang: menuLanguage || "en", // 菜单的原始语言
          userLang: userLanguage, // 用户选择的界面语言，用于生成翻译
          note: orderNote || "", // 点餐备注
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "生成点餐文字失败");
      }

      if (!response.body) {
        throw new Error("响应体为空");
      }

      // 使用 ReadableStream reader 读取流式数据
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = ""; // SSE 数据缓冲区
      let textBuffer = ""; // 文本内容缓冲区

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // 处理剩余的文本
          if (textBuffer.trim()) {
            parseAndUpdateText(textBuffer);
          }
          break;
        }

        // 解码数据块
        sseBuffer += decoder.decode(value, { stream: true });
        
        // 处理 SSE 格式的数据
        const sseLines = sseBuffer.split("\n\n");
        sseBuffer = sseLines.pop() || ""; // 保留最后一个不完整的 SSE 行

        for (const sseLine of sseLines) {
          if (sseLine.startsWith("data: ")) {
            const data = sseLine.slice(6); // 移除 "data: " 前缀
            
            if (data === "[DONE]") {
              // 处理最后的文本缓冲区
              if (textBuffer.trim()) {
                parseAndUpdateText(textBuffer);
                textBuffer = "";
              }
              setIsGeneratingOrder(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              
              if (parsed.chunk) {
                // 将新的文本块添加到缓冲区
                textBuffer += parsed.chunk;
                
                // 实时解析并更新显示
                parseAndUpdateText(textBuffer);
              }
            } catch (parseError) {
              console.warn("解析数据块失败:", parseError);
            }
          }
        }
      }

      setIsGeneratingOrder(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成点餐文字时出错，请稍后重试");
      setIsGeneratingOrder(false);
    }
  };

  // 解析文本并更新状态（根据 "---" 分隔符分割）
  const parseAndUpdateText = (text: string) => {
    // 查找 "---" 分隔符
    const separatorIndex = text.indexOf("\n---\n");
    
    if (separatorIndex !== -1) {
      // 找到分隔符，分割两部分
      const targetPart = text.substring(0, separatorIndex).trim();
      const userLangPart = text.substring(separatorIndex + 5).trim(); // +5 是 "\n---\n" 的长度
      
      setTargetText(targetPart);
      setChineseText(userLangPart); // 这里存储的是用户选择语言的翻译
    } else {
      // 还没找到分隔符，所有内容都是目标语言部分
      setTargetText(text.trim());
    }
  };

  // 复制点餐文字
  const handleCopyOrderText = async () => {
    try {
      await navigator.clipboard.writeText(targetText);
      alert(t("order.copied"));
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  // 获取所有分类（CAT）项
  const categories = menuItems.filter(item => item.type === "CAT");

  // 生成锚点 ID（基于分类的 index）
  const generateAnchorId = (catIndex: number) => `category-${catIndex}`;

  // 滚动到指定分类
  const scrollToCategory = (anchorId: string) => {
    const element = document.getElementById(anchorId);
    if (element) {
      // 考虑固定头部的高度，添加偏移
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setMenuItems([]); // 清空之前的菜品列表
    setMenuLanguage(""); // 重置语言标签
    setIsUploadCollapsed(true); // 自动折叠上传区域

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetLanguage", userLanguage); // 添加目标语言参数

      const response = await fetch("/api/analyze-menu", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "分析失败");
      }

      if (!response.body) {
        throw new Error("响应体为空");
      }

      // 使用 ReadableStream reader 读取流式数据
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = ""; // SSE 数据缓冲区
      let textBuffer = ""; // 文本内容缓冲区

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // 处理剩余的文本
          if (textBuffer.trim()) {
            const remainingLines = textBuffer.split("\n").filter(line => line.trim());
            const parsedItems: MenuItemType[] = remainingLines.map((line, idx) => {
              let type: "LANG" | "INTRO" | "CAT" | "ITEM" = "ITEM";
              let content = line;
              
              if (line.startsWith("LANG|")) {
                type = "LANG";
                content = line.slice(5).trim();
              } else if (line.startsWith("INTRO|")) {
                type = "INTRO";
                content = line.slice(6).trim();
              } else if (line.startsWith("CAT|")) {
                type = "CAT";
                content = line.slice(4).trim();
              } else if (line.startsWith("ITEM|")) {
                type = "ITEM";
                content = line.slice(5).trim();
              }
              
              return { type, content, index: Date.now() + idx };
            });
            
            // 检查是否有语言标签，并保存
            const langItem = parsedItems.find(item => item.type === "LANG");
            if (langItem) {
              setMenuLanguage(langItem.content);
            }
            
            // 只添加非 LANG 类型的项
            const itemsToAdd = parsedItems.filter(item => item.type !== "LANG");
            setMenuItems((prev) => [...prev, ...itemsToAdd]);
          }
          break;
        }

        // 解码数据块
        sseBuffer += decoder.decode(value, { stream: true });
        
        // 处理 SSE 格式的数据
        const sseLines = sseBuffer.split("\n\n");
        sseBuffer = sseLines.pop() || ""; // 保留最后一个不完整的 SSE 行

        for (const sseLine of sseLines) {
          if (sseLine.startsWith("data: ")) {
            const data = sseLine.slice(6); // 移除 "data: " 前缀
            
            if (data === "[DONE]") {
              // 处理最后的文本缓冲区
              if (textBuffer.trim()) {
                const finalLines = textBuffer.split("\n").filter(line => line.trim());
                const parsedItems: MenuItemType[] = finalLines.map((line, idx) => {
                  let type: "LANG" | "INTRO" | "CAT" | "ITEM" = "ITEM";
                  let content = line;
                  
                  if (line.startsWith("LANG|")) {
                    type = "LANG";
                    content = line.slice(5).trim();
                  } else if (line.startsWith("INTRO|")) {
                    type = "INTRO";
                    content = line.slice(6).trim();
                  } else if (line.startsWith("CAT|")) {
                    type = "CAT";
                    content = line.slice(4).trim();
                  } else if (line.startsWith("ITEM|")) {
                    type = "ITEM";
                    content = line.slice(5).trim();
                  }
                  
                  return { type, content, index: Date.now() + idx };
                });
                
                // 检查是否有语言标签，并保存
                const langItem = parsedItems.find(item => item.type === "LANG");
                if (langItem) {
                  setMenuLanguage(langItem.content);
                }
                
                // 只添加非 LANG 类型的项
                const itemsToAdd = parsedItems.filter(item => item.type !== "LANG");
                setMenuItems((prev) => [...prev, ...itemsToAdd]);
                textBuffer = "";
              }
              setIsAnalyzing(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              
              if (parsed.chunk) {
                // 将新的文本块添加到缓冲区
                textBuffer += parsed.chunk;
                
                // 检查缓冲区中是否有完整的行（以换行符分隔）
                const lines = textBuffer.split("\n");
                
                // 如果有多行，处理完整的行
                if (lines.length > 1) {
                  // 保留最后一行（可能不完整）在缓冲区
                  const completeLines = lines.slice(0, -1).filter(line => line.trim());
                  textBuffer = lines[lines.length - 1]; // 保留最后一行
                  
                  // 解析完整的行，识别前缀类型
                  if (completeLines.length > 0) {
                      const parsedItems: MenuItemType[] = completeLines.map((line, idx) => {
                        let type: "LANG" | "INTRO" | "CAT" | "ITEM" = "ITEM";
                        let content = line;
                        
                        if (line.startsWith("LANG|")) {
                          type = "LANG";
                          content = line.slice(5).trim(); // 移除 "LANG|" 前缀
                        } else if (line.startsWith("INTRO|")) {
                          type = "INTRO";
                          content = line.slice(6).trim(); // 移除 "INTRO|" 前缀
                        } else if (line.startsWith("CAT|")) {
                          type = "CAT";
                          content = line.slice(4).trim(); // 移除 "CAT|" 前缀
                        } else if (line.startsWith("ITEM|")) {
                          type = "ITEM";
                          content = line.slice(5).trim(); // 移除 "ITEM|" 前缀
                        }
                        
                        return { type, content, index: Date.now() + idx };
                      });
                      
                      // 检查是否有语言标签，并保存
                      const langItem = parsedItems.find(item => item.type === "LANG");
                      if (langItem) {
                        setMenuLanguage(langItem.content);
                      }
                      
                      // 将解析后的项添加到菜单项（不包括 LANG 类型，因为它不需要显示）
                      const itemsToAdd = parsedItems.filter(item => item.type !== "LANG");
                      setMenuItems((prev) => [...prev, ...itemsToAdd]);
                    }
                }
              }
            } catch (parseError) {
              // 如果解析失败，可能是格式问题，继续处理下一行
              console.warn("解析数据块失败:", parseError);
            }
          }
        }
      }

      setIsAnalyzing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.analysisFailed"));
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-background pb-20">
      {/* 页面头部 - 移动端风格 */}
      <Header 
        selectedItemsCount={selectedItems.length}
        onCartClick={() => setIsCartOpen(true)}
      />
      
      <div className="px-4 py-4 space-y-4">
      {/* 上传区域 - 移动端风格 */}
      {(!file || !isUploadCollapsed) && (
        <Card className="shadow-soft border-border/60 rounded-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-medium">{t("upload.title")}</CardTitle>
                <CardDescription className="mt-1 text-sm">
                  {t("upload.description")}
                </CardDescription>
              </div>
              {file && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsUploadCollapsed(!isUploadCollapsed)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  {isUploadCollapsed ? (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      {t("upload.expand")}
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      {t("upload.collapse")}
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          {!isUploadCollapsed && (
            <CardContent className="space-y-4 pt-0">
              {!file ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-border rounded-lg p-16 text-center hover:border-primary/30 transition-all cursor-pointer bg-muted/30"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto h-14 w-14 text-muted-foreground mb-6 opacity-60" />
                  <p className="text-base font-medium mb-2 text-foreground">
                    {t("upload.clickOrDrag")}
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t("upload.supportedFormatsDetail")}
                  </p>
                  <Button type="button" variant="outline" className="border-border hover:bg-muted">
                    {t("upload.selectFile")}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden border border-border shadow-soft">
                    <div className="relative aspect-video bg-muted/50 flex items-center justify-center">
                      {preview && (
                        <img
                          src={preview}
                          alt="菜单预览"
                          className="max-w-full max-h-full object-contain"
                        />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background border border-border/50"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("upload.analyzing")}
                        </>
                      ) : (
                        t("upload.startAnalysis")
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemoveFile}
                      disabled={isAnalyzing}
                      className="border-border hover:bg-muted"
                    >
                      {t("upload.reSelect")}
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">
                  {error}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}
      
      {/* 上传成功后收缩的窄条 */}
      {isUploadCollapsed && file && (
        <div className="flex items-center justify-between px-4 py-3 bg-card border border-border/60 rounded-xl shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Camera className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{t("upload.uploaded")}</p>
              <p className="text-xs text-muted-foreground">{t("upload.expandToView")}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsUploadCollapsed(false)}
              className="h-8 text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="h-4 w-4 mr-1" />
              {t("upload.expand")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {(menuItems.length > 0 || isAnalyzing) && (
        <div className="space-y-6">
          {menuItems.length === 0 && isAnalyzing ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin inline-block mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">
                    {getLoadingMessages(userLanguage)[loadingMsgIndex]}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 目录导航 - 移动端风格 */}
              {categories.length > 0 && (
                <div className="sticky top-[57px] z-10 bg-background/95 backdrop-blur-sm pb-2">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Menu className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">{t("nav.toc")}</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map((cat) => (
                      <button
                        key={cat.index}
                        onClick={() => scrollToCategory(generateAnchorId(cat.index))}
                        className="text-xs px-3 py-1.5 border border-border/60 rounded-lg bg-card text-foreground hover:bg-muted/50 font-normal whitespace-nowrap flex-shrink-0"
                      >
                        {cat.content}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
              {menuItems.map((item, index) => {
                // 渲染 INTRO：顶部提示框 - 移动端风格
                if (item.type === "INTRO") {
                  return (
                    <div
                      key={item.index}
                      className="bg-muted/50 border border-border/40 rounded-xl p-4 text-sm text-foreground"
                    >
                      <p className="leading-relaxed font-normal">{item.content}</p>
                    </div>
                  );
                }
                
                // 渲染 CAT：分类标题 + 分割线
                if (item.type === "CAT") {
                  const catIndex = categories.findIndex(cat => cat.index === item.index);
                  const anchorId = generateAnchorId(item.index);
                  
                  return (
                    <div 
                      key={item.index} 
                      id={anchorId}
                      className="mt-6 first:mt-0 scroll-mt-[57px]"
                    >
                      <h3 className="text-lg font-sans font-bold text-foreground mb-2 tracking-tight">
                        {item.content}
                      </h3>
                      <div className="h-px bg-border/50 mt-2" />
                    </div>
                  );
                }
                
                // 渲染 ITEM：菜品卡片
                if (item.type === "ITEM") {
                  const parts = item.content.split("|").map(part => part.trim());
                  
                  if (parts.length >= 4) {
                    const [originalName, chineseName, price, description] = parts;
                    const isSelected = selectedItems.some(selected => selected.index === item.index);
                    
                    // 判断是否为英文（简单判断：包含英文字母）
                    const isEnglish = /[a-zA-Z]/.test(originalName);
                    const displayOriginalName = isEnglish 
                      ? originalName.toUpperCase().split('').join(' ') // 全大写并加空格
                      : originalName;
                    
                    return (
                      <Card key={item.index} className="mb-4 shadow-soft border border-border/60 rounded-xl">
                        <CardContent className="p-4">
                          {/* 标题和价格在同一行 */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <CardTitle className="text-base font-semibold text-foreground mb-1">
                                {originalName !== chineseName ? `${originalName} | ${chineseName}` : chineseName || originalName}
                              </CardTitle>
                            </div>
                            {price && price !== "暂无" && (
                              <span className="text-base font-semibold text-foreground ml-2 flex-shrink-0">
                                {price}
                              </span>
                            )}
                          </div>
                          
                          {/* 描述 */}
                          {description && description !== "暂无解读" && (
                            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                              {description}
                            </p>
                          )}
                          
                          {/* 底部操作栏：复选框、询问和书签 */}
                          <div className="flex items-center justify-between pt-2 border-t border-border/40">
                            <button
                              onClick={() => {
                                if (isSelected) {
                                  handleRemoveFromCart(item.index);
                                } else {
                                  handleAddToCart(item);
                                }
                              }}
                              className="flex items-center gap-2 text-foreground hover:opacity-70 transition-opacity"
                            >
                              <div className={`w-5 h-5 border-2 rounded border-foreground flex items-center justify-center ${
                                isSelected ? "bg-foreground" : "bg-transparent"
                              }`}>
                                {isSelected && <Check className="h-3 w-3 text-background" />}
                              </div>
                              <span className="text-sm text-foreground">
                                {isSelected ? t("item.selected") : t("item.select")}
                              </span>
                            </button>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-foreground hover:bg-muted"
                                onClick={() => handleOpenAskDialog(item)}
                                title={t("ask.title") || "询问菜品"}
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-foreground hover:bg-muted"
                              >
                                <Bookmark className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  } else {
                    // 如果格式不正确，显示原始文本
                    return (
                      <Card key={item.index} className="mb-4">
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">{item.content}</p>
                        </CardContent>
                      </Card>
                    );
                  }
                }
                
                return null;
              })}
              {isAnalyzing && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                  <span className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">
                    {getLoadingMessages(userLanguage)[loadingMsgIndex]}
                  </span>
                </div>
              )}
              </div>
            </>
          )}
        </div>
      )}
      </div>

      {/* 购物车 Dialog */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("cart.title")}</DialogTitle>
            <DialogDescription>
              {t("cart.selectedItems", { count: selectedItems.length })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("cart.empty")}
              </div>
            ) : (
              selectedItems.map((item, index) => (
                <Card key={item.index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">
                          {item.chineseName || item.originalName}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.originalName !== item.chineseName && item.originalName}
                          {item.price && item.price !== "暂无" && ` · ${item.price}`}
                        </p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFromCart(item.index)}
                        className="ml-4"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          {/* 备注输入框 */}
          {selectedItems.length > 0 && (
            <div className="space-y-2 py-4 border-t">
              <label htmlFor="order-note" className="text-sm font-medium text-foreground">
                {t("cart.note")}
              </label>
              <textarea
                id="order-note"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder={t("cart.notePlaceholder")}
                className="w-full min-h-[80px] px-3 py-2 text-sm border border-border/60 rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {t("cart.noteHint")}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCartOpen(false)}
            >
              {t("cart.continueSelect")}
            </Button>
            <Button
              onClick={handleConfirmOrder}
              disabled={selectedItems.length === 0 || isGeneratingOrder}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isGeneratingOrder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("cart.generating")}
                </>
              ) : (
                t("cart.confirmOrder")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 点餐助手卡片 - 移动端风格 */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-md w-[90vw] max-h-[85vh] m-0 p-0 rounded-xl flex flex-col [&>button]:hidden bg-background">
          <DialogHeader className="px-4 pt-4 pb-3 border-b border-border/60 flex-shrink-0 bg-background">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">{t("order.title")}</DialogTitle>
                <DialogDescription className="mt-1 text-xs text-muted-foreground">
                  {t("order.description")}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyOrderText}
                  disabled={!targetText}
                  className="h-8 px-3 text-foreground hover:bg-muted"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  <span className="text-xs">{t("order.copy")}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOrderDialogOpen(false)}
                  className="h-8 w-8 text-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {isGeneratingOrder ? (
              <div className="flex-1 flex items-center justify-center bg-background">
                <div className="text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
                  <p className="text-sm">{t("order.generating")}</p>
                </div>
              </div>
            ) : (
              <>
                {/* 上半部分：给服务员看的大字 */}
                <div className="flex-1 bg-background flex items-center justify-center border-b border-border/60 overflow-y-auto">
                  <div className="w-full px-6 py-8">
                    {targetText ? (
                      <div className="text-center [&_p]:text-lg [&_p]:font-medium [&_p]:leading-relaxed [&_p]:m-0 [&_p]:mb-3 [&_*]:text-lg text-foreground [&_*]:text-center">
                        <ReactMarkdown>{targetText}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-lg font-medium leading-relaxed text-center text-muted-foreground">
                        {t("order.waiting")}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* 下半部分：用户语言翻译对照 */}
                <div className="flex-1 bg-muted/30 flex items-center justify-center overflow-y-auto">
                  <div className="w-full px-6 py-8">
                    {chineseText ? (
                      <div className="text-center text-muted-foreground [&_p]:text-base [&_p]:font-normal [&_p]:leading-relaxed [&_p]:m-0 [&_p]:mb-3 [&_*]:text-base [&_*]:text-center">
                        <ReactMarkdown>{chineseText}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-base font-normal leading-relaxed text-center text-muted-foreground">
                        {targetText ? t("order.generatingTranslation") : ""}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 询问菜品对话框 */}
      <Dialog open={isAskDialogOpen} onOpenChange={setIsAskDialogOpen}>
        <DialogContent className="max-w-md w-[90vw] max-h-[85vh] flex flex-col bg-background">
          <DialogHeader className="pb-3 border-b border-border/60 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">{t("ask.title")}</DialogTitle>
                <DialogDescription className="mt-1 text-sm text-muted-foreground">
                  {t("ask.description")}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAskDialogOpen(false)}
                className="h-8 w-8 text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {/* 菜品信息卡片 */}
          {currentDish && (
            <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground mt-4 flex-shrink-0">
              <p className="font-medium text-foreground">{currentDish.originalName}</p>
              {currentDish.description && (
                <p className="mt-1">{currentDish.description}</p>
              )}
            </div>
          )}

          {/* 对话显示区域 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {conversationHistory.length === 0 && !isAsking && (
              <p className="text-center text-muted-foreground text-sm">{t("ask.empty")}</p>
            )}
            
            {conversationHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-foreground"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isAsking && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-lg text-sm bg-muted text-foreground">
                  {currentAnswer ? (
                    currentAnswer
                  ) : (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t("ask.thinking")}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="flex items-center gap-2 p-4 border-t border-border/60 flex-shrink-0">
            <input
              type="text"
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendQuestion();
                }
              }}
              placeholder={t("ask.placeholder")}
              className="flex-1 px-3 py-2 border border-border/60 rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              disabled={isAsking}
            />
            <Button
              size="icon"
              onClick={handleSendQuestion}
              disabled={!currentQuestion.trim() || isAsking}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              {isAsking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20 mx-4 mb-4">
              {error}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* 浮动扫描按钮 */}
      <button
        onClick={() => {
          // 滚动到上传区域或触发文件选择
          if (fileInputRef.current) {
            fileInputRef.current.click();
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        className="fixed bottom-24 right-4 z-30 bg-foreground text-background px-4 py-3 rounded-lg shadow-elevation flex items-center gap-2 hover:opacity-90 transition-opacity"
      >
        <Camera className="h-5 w-5" />
        <span className="font-medium">{t("nav.scanMenu")}</span>
      </button>
      
      {/* 底部导航栏 */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border/60">
        <div className="max-w-md mx-auto flex items-center justify-around px-4 py-2">
          <button className="flex flex-col items-center gap-1 py-2 text-foreground">
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">{t("nav.home")}</span>
          </button>
          <button className="flex flex-col items-center gap-1 py-2 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span className="text-xs">{t("nav.history")}</span>
          </button>
          <button className="flex flex-col items-center gap-1 py-2 text-muted-foreground">
            <User className="h-5 w-5" />
            <span className="text-xs">{t("nav.profile")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

