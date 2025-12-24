// 多语言加载提示消息
export const LOADING_MESSAGES: Record<string, string[]> = {
  "zh-CN": [
    "收到菜单图片了...",
    "AI 正在努力识别菜品和价格...",
    "这页菜单信息量有点大，请耐心等待...",
    "正在为您翻译成中文...",
    "大概还需要十几秒，马上就好！",
    "准备好看看有哪些美味了吗？"
  ],
  "en": [
    "Menu image received...",
    "AI is analyzing dishes and prices...",
    "This menu is quite detailed, hang tight...",
    "Translating everything for you...",
    "Just a few more seconds...",
    "Getting ready to reveal delicious options!"
  ],
  "sv": [
    "Menybild mottagen...",
    "AI analyserar rätter och priser...",
    "Denna meny är ganska detaljerad, håll ut...",
    "Översätter allt åt dig...",
    "Bara några sekunder till...",
    "Förbereder för att visa läckra alternativ!"
  ],
  "es": [
    "Imagen del menú recibida...",
    "La IA está analizando platos y precios...",
    "Este menú es bastante detallado, espera un momento...",
    "Traduciendo todo para ti...",
    "Solo unos segundos más...",
    "¡Preparándose para revelar opciones deliciosas!"
  ],
  "fr": [
    "Image du menu reçue...",
    "L'IA analyse les plats et les prix...",
    "Ce menu est assez détaillé, patientez...",
    "Traduction de tout pour vous...",
    "Encore quelques secondes...",
    "Préparation pour révéler des options délicieuses !"
  ],
  "de": [
    "Menübild erhalten...",
    "KI analysiert Gerichte und Preise...",
    "Dieses Menü ist ziemlich detailliert, bitte warten...",
    "Alles für Sie übersetzen...",
    "Nur noch ein paar Sekunden...",
    "Bereit, köstliche Optionen zu enthüllen!"
  ],
  "it": [
    "Immagine del menu ricevuta...",
    "L'IA sta analizzando piatti e prezzi...",
    "Questo menu è abbastanza dettagliato, aspetta...",
    "Traducendo tutto per te...",
    "Solo pochi secondi in più...",
    "Preparazione per rivelare opzioni deliziose!"
  ],
  "ja": [
    "メニュー画像を受信しました...",
    "AIが料理と価格を分析中...",
    "このメニューはかなり詳細です。お待ちください...",
    "すべてを翻訳中...",
    "あと数秒です...",
    "美味しいオプションを準備中です！"
  ],
  "ko": [
    "메뉴 이미지를 받았습니다...",
    "AI가 요리와 가격을 분석 중입니다...",
    "이 메뉴는 꽤 상세합니다. 잠시만 기다려주세요...",
    "모든 것을 번역 중입니다...",
    "몇 초만 더 기다려주세요...",
    "맛있는 옵션을 준비 중입니다!"
  ],
};

// 获取指定语言的加载消息数组，如果不存在则返回英语版本
export function getLoadingMessages(langCode: string): string[] {
  // 尝试精确匹配
  if (LOADING_MESSAGES[langCode]) {
    return LOADING_MESSAGES[langCode];
  }
  
  // 尝试匹配语言代码前缀（如 zh-CN -> zh）
  const langPrefix = langCode.split("-")[0];
  if (LOADING_MESSAGES[langPrefix]) {
    return LOADING_MESSAGES[langPrefix];
  }
  
  // 默认返回英语
  return LOADING_MESSAGES["en"];
}

