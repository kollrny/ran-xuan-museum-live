/* 动画补丁（实验版 2026-11-17 收束）
 * 翻页由 motion.js 单独负责：不再在 render 后重复添加 page-enter
 *（原先 650ms，与 motion.css 的 450ms 冲突，且未检查「减少动态效果」）。
 * 按钮波纹由 motion.css 的 :active 负责，这里不再插入 .ripple-effect。
 * 本文件仍保留引用，避免改动 index.html 的加载结构。
 */
(() => {
  'use strict';
})();
