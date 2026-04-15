Title: Obsidian 接入 DeepSeek API 指南：Text Generator 插件配置教程
Date: 2025-05-12 15:07:00
Tags: obsidian, deepseek, ai
Slug:  obsidian-deepseek-text-generator
Author: 老树
Summary: **Obsidian 接入 DeepSeek API 的配置教程**，使用 **Text Generator 插件**实现智能文本生成功能。教程使用 Text Generator 插件 + DeepSeek API 生成，并经过人工校对。

以下是 **Obsidian 接入 DeepSeek API 的配置教程**，使用 **Text Generator 插件**实现智能文本生成功能。教程使用 Text Generator 插件 + DeepSeek API 生成，并经过人工校对：

---

### **1. 安装 Text Generator 插件**
1. 打开 Obsidian → 点击左侧边栏 `Settings` (设置)或菜单栏 `Preferences` 
2. 进入 `Community plugins` (社区插件) → 点击 `Browse`  
3. 搜索 **Text Generator** → 安装并启用插件。

![](/static/obsidian_deepseek_2025.05/1.png)


---

### **2. 获取 DeepSeek API Key**
1. 访问 [DeepSeek 官网](https://deepseek.com) 注册/登录账号；
2. 进入 API 管理页面（如无公开API，需联系官方申请权限）；
![](/static/obsidian_deepseek_2025.05/2.png)
3. 复制生成的 **API Key**（保存到安全位置，后面无法通过 deepseek 平台查看）；
4. 充值（**很重要，否则后面会出错**）

---

### **3. 配置 Text Generator 插件**
1. 在 Obsidian 中打开 `Settings` → 找到 `Text Generator` 插件设置。  
2. 在 `API Provider` 中选择 **Custom** 或 **通过+创建自定义配置**（若支持）。
![](/static/obsidian_deepseek_2025.05/3.png)
> 注：如上截图，已勾选的 `deepseek` 是通过后面的 `+` 创建出来的。

3. 填写以下参数：
   - **API URL**: DeepSeek API 的端点地址（如 `https://api.deepseek.com/chat/completions`）  
   - **API Key**: 粘贴你的 DeepSeek API Key  
   - **Model Name**: 填写模型名称（如 `deepseek-chat`，根据官方文档调整）  
![](/static/obsidian_deepseek_2025.05/4.png)

---

### **4. 测试 API 连接**
1. 在 Obsidian 中新建一个笔记，输入内容并选中；
2. 按快捷键 `Ctrl/Cmd + J` 即可自动生成；
![](/static/obsidian_deepseek_2025.05/5.png)
3. 观察是否返回 DeepSeek 生成的文本，若无响应请检查：  
   - API Key 和 URL 是否正确  
   - 网络是否畅通  
   - DeepSeek 账户是否有足够配额  

---

### **5. 高级设置（可选）**
- **自定义提示模板**：在插件设置中修改 `Prompt Template`，适配你的工作流。  
- **调整参数**：如 `temperature`（随机性）、`max_tokens`（生成长度）等。  

---

### **常见问题**
- **Q**: 插件报错 `n.text is not a function`？  
  **A**: 在插件的 `Advance mode` 里把 `CORS Bypass`  打开
![](/static/obsidian_deepseek_2025.05/6.png)
- **Q**: 提示 `404` 或者 `Not Found` 之类
  **A**: 确认 API 地址（`Endpoint`）填写正确，如这里是：`https://api.deepseek.com/chat/completions`
- **Q**: 提示 `402` 或者 `Failed to load resource` 之类
  **A**: 先充值！
- **Q**: 如何查看其他报错的详细信息
  **A**: MacOS，使用：`Cmd+Option+I` 打开控制台查看
![](/static/obsidian_deepseek_2025.05/7.png)

---

通过以上步骤，你可以在 Obsidian 中无缝调用 DeepSeek 的 AI 能力。如果需要更详细的配置（如本地代理），可参考插件官方文档或 DeepSeek API 说明。
