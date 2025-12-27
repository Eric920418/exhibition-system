/**
 * Scroll-Driven Animations 工具庫
 *
 * 使用前請確保在全局樣式中引入 CSS:
 * import '@/styles/scroll-animations.css'
 *
 * @example
 * // React 元件中使用
 * <div data-animate="fade-in-up">內容</div>
 *
 * // 或使用工具函數
 * <div {...scrollAnimate('scale-reveal')}>內容</div>
 *
 * // 帶延遲的多個元素
 * {items.map((item, i) => (
 *   <div key={i} {...scrollAnimate('fade-in-up', i + 1)}>
 *     {item}
 *   </div>
 * ))}
 */

export type ScrollAnimation =
  | 'fade-in-up'      // 淡入向上滑（最常用）
  | 'scale-reveal'    // 縮放揭示（適合圖片）
  | 'slide-rotate'    // 滑入旋轉（有趣吸睛）
  | 'parallax'        // 視差效果（背景專用）
  | 'accordion'       // 手風琴展開（文字區塊）
  | 'blur-in';        // 模糊聚焦（高級感）

export type ScrollAnimationDelay = 1 | 2 | 3 | 4 | 5;

/**
 * 檢測瀏覽器是否支援 Scroll-Driven Animations
 */
export function isScrollAnimationSupported(): boolean {
  if (typeof window === 'undefined') return false;

  return CSS.supports('animation-timeline', 'view()');
}

/**
 * 為元素加上滾動動畫
 *
 * @param animation - 動畫類型
 * @param delay - 延遲序號（1-5），用於錯開同組元素的動畫
 * @returns React props 物件
 *
 * @example
 * <div {...scrollAnimate('fade-in-up')}>內容</div>
 * <div {...scrollAnimate('scale-reveal', 2)}>延遲出場</div>
 */
export function scrollAnimate(
  animation: ScrollAnimation,
  delay?: ScrollAnimationDelay
): {
  'data-animate': ScrollAnimation;
  'data-animate-delay'?: ScrollAnimationDelay;
} {
  const props: any = {
    'data-animate': animation,
  };

  if (delay) {
    props['data-animate-delay'] = delay;
  }

  return props;
}

/**
 * 為 className 字串加上動畫（適用於需要自定義 class 的場景）
 *
 * @example
 * <div className={scrollAnimateClass('fade-in-up', 'my-custom-class')}>
 *   內容
 * </div>
 */
export function scrollAnimateClass(
  animation: ScrollAnimation,
  baseClass?: string
): string {
  return baseClass || '';
}

/**
 * 批量為列表元素加上動畫
 * 自動為每個元素加上遞增的延遲
 *
 * @example
 * {scrollAnimateList(items, 'fade-in-up').map(({ props, item }, i) => (
 *   <div key={i} {...props}>{item.name}</div>
 * ))}
 */
export function scrollAnimateList<T>(
  items: T[],
  animation: ScrollAnimation
): Array<{ props: ReturnType<typeof scrollAnimate>; item: T; index: number }> {
  return items.map((item, index) => ({
    props: scrollAnimate(
      animation,
      // 限制最大延遲為 5
      ((index % 5) + 1) as ScrollAnimationDelay
    ),
    item,
    index,
  }));
}

/**
 * 動畫使用建議（幫助開發者選擇合適的動畫）
 */
export const ANIMATION_RECOMMENDATIONS = {
  'fade-in-up': {
    name: '淡入向上滑',
    bestFor: ['作品卡片', '一般內容區塊', '列表項目'],
    performance: '優秀',
  },
  'scale-reveal': {
    name: '縮放揭示',
    bestFor: ['圖片', '海報', '展覽封面'],
    performance: '優秀',
  },
  'slide-rotate': {
    name: '滑入旋轉',
    bestFor: ['重點亮點', '特色區域', 'Call-to-Action'],
    performance: '良好',
  },
  parallax: {
    name: '視差效果',
    bestFor: ['背景圖', '裝飾性元素', '大型視覺區'],
    performance: '中等（避免過度使用）',
  },
  accordion: {
    name: '手風琴展開',
    bestFor: ['文字段落', '說明區塊', '卡片內容'],
    performance: '優秀',
  },
  'blur-in': {
    name: '模糊聚焦',
    bestFor: ['重要標題', '重點區域', '英雄區塊'],
    performance: '中等（模糊效果耗效能）',
  },
} as const;

/**
 * 展覽系統常用組合（預設配置）
 */
export const EXHIBITION_PRESETS = {
  /** 作品網格（最常用） */
  artworkGrid: 'fade-in-up' as const,

  /** 展覽封面 */
  exhibitionHero: 'scale-reveal' as const,

  /** 背景裝飾 */
  background: 'parallax' as const,

  /** 重點亮點 */
  highlight: 'slide-rotate' as const,

  /** 文字段落 */
  textBlock: 'accordion' as const,

  /** 頁面標題 */
  pageTitle: 'blur-in' as const,
} as const;
