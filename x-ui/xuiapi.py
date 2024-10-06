import requests


# 获取 cookie
def getSession(url):
    # 定义请求的表单数据
    data = {"username": "admin", "password": "admin"}

    # 定义请求的头信息
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    }

    # 发送 POST 请求
    response = requests.post(url + "/login", data=data, headers=headers)

    # 检查响应状态码
    if response.status_code == 200:
        # 获取响应头中的 Set-Cookie 中的 session
        cookies = response.cookies
        session_cookie = cookies.get("session")
        return session_cookie
    else:
        return None


# 获取服务器配置信息 inbound
def get_server_status(url, session_cookie):
    # 定义请求的头信息
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Cookie": f"session={session_cookie}",
    }
    # 发送 POST 请求
    response = requests.post(url + "/server/status", headers=headers)

    # 检查响应状态码
    if response.status_code == 200:
        # 打印返回的 JSON 数据
        return response.json()
    else:
        return None


# 获取节点列表
def get_inbound_list(url, session_cookie):
    # 定义请求的头信息
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Cookie": f"session={session_cookie}",
    }
    # 发送 POST 请求
    response = requests.post(url + "/xui/inbound/list", headers=headers)

    # 检查响应状态码
    if response.status_code == 200:
        # 打印返回的 JSON 数据
        return response.json()
    else:
        return None
