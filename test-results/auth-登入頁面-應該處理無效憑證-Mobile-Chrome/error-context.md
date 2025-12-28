# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - heading "展覽管理系統" [level=1] [ref=e4]
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]: 電子郵件
        - textbox "電子郵件" [ref=e8]:
          - /placeholder: admin@example.com
          - text: invalid@test.com
      - generic [ref=e9]:
        - generic [ref=e10]: 密碼
        - textbox "密碼" [ref=e11]:
          - /placeholder: ••••••••
          - text: wrongpassword
      - generic [ref=e12]: 登入失敗，請檢查您的電子郵件和密碼
      - button "登入" [ref=e13] [cursor=pointer]
  - region "Notifications (F8)":
    - list
  - button "Open Next.js Dev Tools" [ref=e19] [cursor=pointer]:
    - img [ref=e20]
  - alert [ref=e23]
```