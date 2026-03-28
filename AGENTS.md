# Agent Rules — Software Design Pratice V1.01

## 專案背景
VB.NET 丙級術科練習系統
技術棧：純 HTML/CSS/JS + Firebase Firestore + Playwright

## Coding Standards
- 不可引入任何 npm 套件或 JS 框架
- 所有新功能必須附 Playwright 測試
- 不可修改 common.css 的 overlay 結構
- saveScore() 不可清除排行榜快取

## 關卡順序（每次改動必須確認）
SETUP → Q1~Q5 × T01~T03 → 1060306~1060308（共 19 關）

## QA Checklist
- [ ] 所有 19 關 nextlevel 銜接正確
- [ ] 星星計算符合文件規則（0提示=3星）
- [ ] 防貼上機制在打字頁面有效
- [ ] localStorage 快取 TTL 正確
- [ ] npm test 全部通過

## 禁止事項
- 不可直接修改 main branch
- 不可修改 Firestore 安全規則
- 不可移除 dev=1 跳關功能
