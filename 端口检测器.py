#原贴： 分享一个我自己写的端口检测工具（欢迎提意见） https://linux.do/t/topic/179938
#!/usr/bin/python
# -*- coding: UTF-8 -*-

import encodings.idna
import socket
import tkinter as tk
from tkinter import messagebox, ttk
from concurrent.futures import ThreadPoolExecutor, as_completed
import re


def check_port(ip_or_domain, port):
    try:
        with socket.create_connection((ip_or_domain, port), timeout=1):
            return True
    except (socket.timeout, socket.error):
        return False

# 检查是否是域名或者IP
def is_ip_or_domain(input_str):
    # IP地址的正则表达式
    ip_pattern = r'^\d{1,3}(\.\d{1,3}){3}$'

    # 域名的正则表达式，这个比较简单，可以根据需要扩展
    domain_pattern = r'^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*(\.[a-zA-Z]{2,})$'

    if re.match(ip_pattern, input_str) or re.match(domain_pattern, input_str):
        return True
    else:
        return False


def on_check():
    ip_or_domain = ip_entry.get().strip() or "127.0.0.1"
    if not is_ip_or_domain(ip_or_domain):
        messagebox.showwarning("输入错误", "输入域名或IP不合法")
        return

    ports_input = port_entry.get().strip() or "22,23,80,3389,443,5432,6379,1433,1521,3306"

    if not ports_input:
        messagebox.showwarning("输入错误", "请输入端口号")
        return
    else:
        try:
            print(ports_input)
            selected_ports = [int(p.strip()) for p in ports_input.split(",")]
        except ValueError as exc:
            messagebox.showerror("错误", "端口号输入不正确，请确保所有端口号都是数字: {}".format(exc))
            return

    result_list.delete(*result_list.get_children())
    # 配置标签
    result_list.tag_configure('green', foreground='green', font=16)
    result_list.tag_configure('red', foreground='red', font=16)

    # 使用线程池来并行检查端口
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_port = {executor.submit(check_port, ip_or_domain, port): port for port in selected_ports}
        for future in as_completed(future_to_port):
            port = future_to_port[future]
            try:
                status = future.result()
                result = "开放" if status else "关闭"
                result_color = "green" if status else "red"
                # 插入带有颜色的行
                result_list.insert("", "end", values=(ip_or_domain, port, result), tags=(result_color,))
            except Exception as exc:
                messagebox.showerror("错误", "端口号输入不正确，请确保所有端口号都是数字: {}".format(exc))


def on_clear():
    ip_entry.delete(0, tk.END)
    port_entry.delete(0, tk.END)
    result_list.delete(*result_list.get_children())


if __name__ == '__main__':
    # 创建主窗口
    root = tk.Tk()
    root.title("端口检查器（作者QQ：327844761）")
    # 禁止调整窗口大小
    root.resizable(0, 0)

    # 创建输入框和标签
    tk.Label(root, text="IP或域名 (默认: 127.0.0.1)").grid(row=0, column=0, padx=10, pady=10)
    ip_entry = tk.Entry(root, width=30)
    ip_entry.grid(row=0, column=1, padx=10, pady=10)

    tk.Label(root, text="端口号 (逗号分隔)").grid(row=1, column=0, padx=10, pady=10)
    port_entry = tk.Entry(root, width=30)
    port_entry.grid(row=1, column=1, padx=10, pady=10)

    # 创建按钮
    check_button = tk.Button(root, text="检查端口", command=on_check)
    check_button.grid(row=6, column=0, padx=5, pady=5)

    clear_button = tk.Button(root, text="清空输入", command=on_clear)
    clear_button.grid(row=6, column=1, padx=5, pady=5)

    # 创建结果显示列表
    result_list = ttk.Treeview(root, columns=("IP/域名", "端口", "状态"), show="headings")
    result_list.heading("IP/域名", text="IP/域名", anchor="center")
    result_list.heading("端口", text="端口", anchor="center")
    result_list.heading("状态", text="状态", anchor="center")

    # 设置每一列内容居中显示
    result_list.column("IP/域名", anchor="center")
    result_list.column("端口", anchor="center")
    result_list.column("状态", anchor="center")

    result_list.grid(row=7, column=0, columnspan=2, padx=10, pady=10)

    # 添加滚动条
    scrollbar = ttk.Scrollbar(root, orient="vertical", command=result_list.yview)
    result_list.configure(yscroll=scrollbar.set)
    scrollbar.grid(row=7, column=2, sticky="ns")

    # 计算窗口居中所需的宽度和高度
    window_width = 620
    window_height = 400
    position_right = int(root.winfo_screenwidth() / 2 - window_width / 2)
    position_down = int(root.winfo_screenheight() / 2 - window_height / 2)

    # 设置窗口大小和位置
    root.geometry("{}x{}+{}+{}".format(window_width, window_height, position_right, position_down))

    # 启动主循环
    root.mainloop()
