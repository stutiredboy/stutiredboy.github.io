Title: 用 Hammerspoon 搞定远程锁屏与 SMB 动态挂载
Date: 2026-08-15 14:20:00
Tags: mac, hammerspoon, lua, automation, smb, screensharing
Slug: hammerspoon-screen-sharing-and-smb-automount
Author: 陈小生
Summary: 结合 M4 Mac mini 与 M5 MacBook Air 的双机协作场景，使用 Hammerspoon 的数十行 Lua 代码解决远程屏幕共享防锁屏与 40 Gbps / Tailscale 多通道 SMB 动态安全挂载两个痛点。


## 01 我的双 Mac 工作流与两个真实痛点

我的日常工作流由两台 Mac 组成：
* 一台 **M4 Mac mini**：放在工位充当算力中心，常驻跑一些耗时较长的 AI 任务与重型脚本，外挂了一块 2 TB 的高速 SSD；
* 一台 **M5 MacBook Air**：主力移动设备，用来写方案、做设计、做决策，经常带去会议室或外出办公。

在工位时，两台设备通过一条 40 Gbps 的高速 USB-C 线直连（建立高带宽的 Direct IP 连接）；外出时，则通过 Tailscale 组网连接。

![双 Mac 硬件架构与双通道网络拓扑](/static/hammerspoon-screen-sharing-and-smb-automount/workflow.jpg)

看似美好的双机流，在实际使用中却撞上了两个极度影响体验的痛点。

---

### 痛点一：Mac mini 远程屏幕共享——「人在不锁，人走即锁」

为了管理 Mac mini 上跑的 AI 任务，我经常在 MacBook Air 上通过 macOS 原生的 Screen Sharing（屏幕共享）连过去查看。

这时就出现了两难：
1. **保留系统默认闲置锁屏**：远程查看着训练日志或思考方案，稍微停顿几分钟，远程桌面就黑屏锁定，必须重新键入密码解锁。一天下来要输几十次密码，体验非常割裂。
2. **彻底关闭锁屏密码**：极其危险。万一哪天有人给 Mac mini 插上便携显示器，或者直接在物理机上操作，就能毫无阻拦地直通桌面。

**核心诉求**：只要我的屏幕共享连接着，就阻止锁屏；只要我一断开连接，立即恢复锁定。

---

### 痛点二：大文件跨机共享——告别 Git 冗余，动态挂载外挂盘

两台电脑之间必然存在数据同步需求：
* 最初我习惯用 Git 做同步：Mac mini 这边跑完 `git commit`，MacBook Air 那边 `git pull`。
* 但很快遇到瓶颈：很多 AI 中间数据、方案设计素材体积非常大，且往往不到适合作为版本提交（commit）的时机。如果硬塞进 Git，会迅速吃光两台 Mac 宝贵的内置硬盘空间。

顺理成章的解法是：**把 Mac mini 外挂的 2 TB 硬盘通过 macOS 自带的 SMB 共享出来**，MacBook Air 直接挂载使用。

但这个方案带来了新的难题：
1. **多网络自动适应**：在工位插着 USB-C 线时，我希望优先走 40 Gbps 极速直连通道（`169.254.169.99`）；带着 MacBook Air 移动办公时，又希望它自动切换走 Tailscale 的网络通道（`mini` 主机名）。
2. **安全与自动化的矛盾**：如果用常规 Shell 脚本执行 `mount_smbfs` 命令，macOS 要求必须开启「Windows 文件共享」。开启时系统会明确警告「密码将以不安全的方式存储」。而 Finder（Cmd + K）之所以能免密秒进，是因为使用了两台 Mac 绑定的 Apple ID 凭据认证。
3. **断网卡死与弹窗骚扰**：当网络未连通时，如果盲目执行挂载，macOS 会在后台阻塞等待 TCP 超时达数分钟，最后弹出烦人的系统错误对话框。

---

## 02 解决方案：Hammerspoon 小工具解决大问题

以前遇到这种需求，通常得写一堆复杂的 Shell 脚本配 launchd 守护进程，或者安装好几个臃肿的常驻软件。

直到用上了 **Hammerspoon**。它的定位是 macOS 系统的 Lua 胶水层，体积极小，能直接调用系统底层的电源管理、网络事件和 AppleScript 接口。用几十行 Lua 配置，就把两个难题彻底理顺了。

---

### 场景 1：精准控制 Mac mini 锁屏策略

在 Mac mini 端的 Hammerspoon 中，通过监听 5900 端口（macOS 屏幕共享的 VNC 端口）的连接状态，动态调用 `hs.caffeinate` 电源管理接口：

![Mac mini 智能锁屏自动化流转逻辑](/static/hammerspoon-screen-sharing-and-smb-automount/smart_lock.jpg)

* **检测到 5900 端口有 `ESTABLISHED` 连接**：激活 `displayIdle` 阻止屏幕变暗和锁屏。
* **检测到连接断开**：释放 `displayIdle`，交还系统默认的锁屏策略。

```lua
-- ~/.hammerspoon/init.lua (运行在 Mac mini 上)
local connected = false

local function checkVNC()
    local output = hs.execute("netstat -an | grep '\\.5900 .*ESTABLISHED'")
    if output ~= "" then
        hs.caffeinate.set("displayIdle", true, true)
        if not connected then
            hs.notify.new({
                title = "Hammerspoon",
                informativeText = "Screen Sharing 已连接，防锁屏已启用"
            }):send()
            connected = true
        end
    else
        hs.caffeinate.set("displayIdle", false, true)
        if connected then
            hs.notify.new({
                title = "Hammerspoon",
                informativeText = "Screen Sharing 已断开，防锁屏已关闭"
            }):send()
            connected = false
        end
    end
end

-- 每 3 秒检测一次
hs.timer.doEvery(3, checkVNC):start()
```

这样既免去了远程操作时频繁输密码的烦恼，又保证了断开连接后即使物理接上显示器也是锁屏状态。

---

### 场景 2：USB-C 直连 / Tailscale 多通道智能挂载

在 MacBook Air 端的 Hammerspoon 中，实现了以下全自动逻辑：

![SMB 动态双通道自动挂载与 445 端口预检逻辑](/static/hammerspoon-screen-sharing-and-smb-automount/smb_automount.jpg)

1. **445 端口 1 秒静默预检**：在发起挂载前，先用 `nc -z -w 1` 测试目标的 445（SMB）端口。如果网络不通，1 秒内静默跳过，彻底避免系统弹窗与数分钟的线程阻塞。
2. **复用原生 Apple ID 认证**：通过 `hs.osascript` 调用 AppleScript 的 `mount volume` 命令。不仅免去在脚本中硬编码密码，还完全不需要开启不安全的「Windows 文件共享」，保持最高安全级别。
3. **优先级与静默 Fallback**：优先挂载 USB-C 高速直连通道（`169.254.169.99`）；若不通则静默回退到 Tailscale 节点（`mini`）。
4. **内核事件监听**：通过 `hs.network.reachability` 监听网络状态，插上网线或网络连通瞬间即刻自动触发挂载。

```lua
-- ~/.hammerspoon/init.lua (运行在 MacBook Air 上)
local servers   = { "169.254.169.99", "mini" } -- 优先 USB-C 直连，Fallback 到 Tailscale
local shareName = "TiPlus"                     -- Mac mini 外挂的 2 TB 共享名
local mountTimer = nil

-- 检查是否已挂载（兼容 /Volumes/TiPlus 及 TiPlus-1 等路径）
local function isMounted()
    local iter, dir_obj = hs.fs.dir("/Volumes")
    if iter then
        for file in iter, dir_obj do
            if file:sub(1, 6) == "TiPlus" then
                return true, "/Volumes/" .. file
            end
        end
    end
    return false, nil
end

-- 静默预检：1 秒内检测 445 端口，拦截系统报错弹窗
local function isPortOpen(host)
    local cmd = string.format("nc -z -w 1 %s 445 >/dev/null 2>&1", host)
    local code = os.execute(cmd)
    return (code == 0 or code == true)
end

-- 挂载核心函数
local function mountTiPlus(manualAlert)
    local mounted, currentPath = isMounted()
    if mounted then
        print("[TiPlus] 已经挂载于: " .. currentPath)
        if manualAlert then hs.alert.show("TiPlus 已经挂载于 " .. currentPath) end
        return true
    end

    if manualAlert then hs.alert.show("正在尝试挂载 TiPlus...") end

    -- 依次尝试高速直连 IP 与 Tailscale 域名
    for _, serverHost in ipairs(servers) do
        print("[TiPlus] 正在预检服务器 " .. serverHost .. " 端口...")
        if isPortOpen(serverHost) then
            local shareURL = "smb://" .. serverHost .. "/" .. shareName
            print("[TiPlus] 端口连通，执行安全挂载: " .. shareURL)
            
            local ok, result = hs.osascript.applescript('mount volume "' .. shareURL .. '"')
            if ok then
                print("[TiPlus] 挂载成功，当前通道: " .. serverHost)
                if manualAlert then hs.alert.show("TiPlus 挂载成功（" .. serverHost .. "）") end
                return true
            end
        else
            print("[TiPlus] 节点 " .. serverHost .. " 离线，静默跳过")
        end
    end

    print("[TiPlus] 当前所有网络通道均不可达")
    if manualAlert then hs.alert.show("TiPlus 挂载失败，网络未连通") end
    return false
end

-- 1. 启动或重载配置时主动检测一次
mountTiPlus(false)

-- 2. 网络事件监听：无论哪条通道恢复连通，自动尝试挂载
for _, serverHost in ipairs(servers) do
    local reachability = hs.network.reachability.forHostName(serverHost)
    if reachability then
        reachability:setCallback(function(self, flags)
            local isReachable = (flags & hs.network.reachability.flags.reachable) > 0
            if isReachable then
                if mountTimer then mountTimer:stop() end
                mountTimer = hs.timer.doAfter(1, function()
                    mountTiPlus(false)
                end)
            end
        end):start()
    end
end

-- 3. 快捷键手动挂载 (Option + Command + M)
hs.hotkey.bind({"alt", "cmd"}, "M", function()
    mountTiPlus(true)
end)
```

---

## 03 总结与体会

在配置好之后，整个工作流的体验变得极其顺畅：

* **远程控制 Mac mini**：屏幕共享连上即用，中间查资料再也不会频繁被锁屏打断；断开连接后自动锁定，安全无虞。
* **数据共享**：插上 40 Gbps 的 USB-C 线，极速共享盘瞬间挂载到位；拔掉线出门，切到 Tailscale 依然能在后台无感访问，不需要在命令行敲密码，更不需要降级安全性。

Hammerspoon 确实是个非常轻量又方便的小工具，用几十行代码就能把日常使用中很具体的痛点给顺畅解决掉，推荐给有类似需求的朋友。
