# https://linux.do/t/topic/233723/1    你们要的注册机它来了！！！ 
# -*- coding: utf-8 -*-
import os
import string
import random
import re
import time
import ddddocr
from curl_cffi import requests
# import requests

from urllib.parse import quote
from loguru import logger
import uvicorn
from fastapi import FastAPI, Form, BackgroundTasks
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

ocr = ddddocr.DdddOcr()

app = FastAPI()

# 静态文件目录
os.makedirs("/static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")
cache = {}


@app.get("/", response_class=HTMLResponse)
async def get_form():
    example_string = "未获取到内容"
    timestamp = int(time.time())
    html_content = f"""
        <html>
            <head>
                <title>Image Form</title>
            </head>
            <body>
                <h1>Submit Your Data</h1>
                <form action="/submit" method="post">
                    <img src="/static/image.jpg?timestamp={timestamp}" alt="Sample Image" width="300"/>
                    <br><br>
                    <label for="input_email">输入邮箱id:</label>
                    <input type="text" id="input_email" name="input_email" value="1" oninput="saveInputValue('input_email')">
                    <br><br>
                    <label for="input_data">输入验证码:</label>
                    <input type="text" id="input_data" name="input_data" oninput="saveInputValue('input_data')">
                    <br><br>
                    <label for="display_string">自动处理验证码:</label>
                    <input type="text" id="display_string" name="display_string" value="{example_string}" readonly onclick="refreshDisplayString()">
                    <br><br>
                    <button type="submit">手动提交</button>
                    <button type="button" onclick="startTask()">开始任务</button>
                </form>
                <script>
                    // 在页面加载时恢复文本框内容
                    window.onload = function() {{
                        const inputId = document.getElementById('input_email');
                        const inputData = document.getElementById('input_data');
                        inputId.value = localStorage.getItem('input_email') || 'xxxxx@gmail.com';
                        inputData.value = localStorage.getItem('input_data') || '';
                    }};

                    // 保存文本框内容到本地存储
                    function saveInputValue(id) {{
                        const input = document.getElementById(id);
                        localStorage.setItem(id, input.value);
                    }}

                    function refreshDisplayString() {{
                        const inputId = document.getElementById('input_email').value;
                        fetch(`/refresh-display-string?input_email=${{inputId}}`)
                            .then(response => response.json())
                            .then(data => {{
                                document.getElementById('display_string').value = data.display_string;
                            }});
                    }}

                    function startTask() {{
                        fetch('/start-task', {{
                            method: 'POST',
                            headers: {{
                                'Content-Type': 'application/json'
                            }},
                            body: JSON.stringify({{ data: document.getElementById('input_email').value }})
                        }})
                        .then(response => response.json())
                        .then(data => {{
                            alert(data.message);
                        }});
                    }}
                </script>
            </body>
        </html>
        """
    return HTMLResponse(content=html_content)


@app.post("/submit")
async def handle_form(input_email: str = Form(...), input_data: str = Form(...)):
    if cache.get(input_email) and cache[input_email].get("auto"):
        cache[input_email].update({"sd": input_data})
    return {"message": f"You submitted: 邮箱id：{input_email} 输入内容：{input_data}"}


@app.get("/static/image.jpg")
async def get_image():
    try:
        return FileResponse("static/image.jpg", headers={
            "Cache-Control": "no-store"
        })
    except:
        return HTMLResponse("")


@app.get("/refresh-display-string")
async def refresh_display_string(input_email: str):
    ns = cache.get(input_email, {"auto": None, "sd": None})
    if ns.get('sd'):
        ns = f"手动：{ns.get('sd')}"
    elif ns.get('auto'):
        ns = f"自动：{ns.get('auto')}"
    else:
        ns = "未获取到内容"
    return {"display_string": ns}


@app.post("/start-task")
async def start_task(data: dict, background_tasks: BackgroundTasks):
    input_data = data.get("data")
    background_tasks.add_task(background_task, input_data)
    return {"message": "Task started"}


def get_user_name():
    url = "http://www.ivtool.com/random-name-generater/uinames/api/index.php?region=united states&gender=female&amount=5&="
    header = {
        "Host": "www.ivtool.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Priority": "u=1",
    }
    resp = requests.get(url, headers=header, verify=False)
    print(resp.status_code)
    if resp.status_code != 200:
        print(resp.status_code, resp.text)
        raise "获取名字出错"
    data = resp.json()
    return data


def generate_random_username():
    length = random.randint(7, 10)
    characters = string.ascii_letters
    random_string = ''.join(random.choice(characters) for _ in range(length))
    return random_string


def background_task(input_email):
    usernames = get_user_name()
    email = input_email
    url1 = "https://www.serv00.com/offer/create_new_account"
    # ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0"
    ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

    header1 = {
        "Host": "www.serv00.com",
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2",
        "Connection": "keep-alive",
        # "Referer": "https://www.serv00.com/offer/create_new_account",
        "Referer": "https://www.serv00.com/offer",
        "Sec-GPC": "1",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Priority": "u=1",
    }

    captcha_url = "https://www.serv00.com/captcha/image/{}/"
    header2 = {
        "Host": "www.serv00.com",
        "User-Agent": ua,
        "Accept": "image/avif,image/webp,*/*",
        "Accept-Language": "zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2",
        "Sec-GPC": "1",
        "Connection": "keep-alive",
        "Referer": "https://www.serv00.com/offer/create_new_account",
        "Cookie": "csrftoken={}",
        "Sec-Fetch-Dest": "image",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "same-origin",
        "Priority": "u=4",
        "TE": "trailers",
    }

    url3 = "https://www.serv00.com/offer/create_new_account.json"
    header3 = {
        "Host": "www.serv00.com",
        "User-Agent": ua,
        "Accept": "*/*",
        "Accept-Language": "zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "Origin": "https://www.serv00.com",
        "Connection": "keep-alive",
        "Referer": "https://www.serv00.com/offer/create_new_account",
        "Cookie": "csrftoken={}",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Priority": "u=1",
    }

    _ = usernames.pop()
    first_name = _["name"]
    last_name = _["surname"]
    username = generate_random_username().lower()
    logger.info(f"{email} {first_name} {last_name} {username}")

    with requests.Session() as session:
        logger.info("获取网页信息")
        resp = session.get(url=url1, headers=header1, impersonate="chrome124")
        print(resp.status_code)
        headers = resp.headers
        content = resp.text

        csrftoken = re.findall(r"csrftoken=(\w+);", headers.get("set-cookie"))[0]
        # csrftoken = csrftoken or re.findall(r"input type='hidden' name='csrfmiddlewaretoken' value='(\w+)'", content)[0]
        print("csrftoken", csrftoken)
        header2["Cookie"] = header2["Cookie"].format(csrftoken)
        header3["Cookie"] = header3["Cookie"].format(csrftoken)

        captcha_0 = re.findall(r'id=\"id_captcha_0\" name=\"captcha_0\" value=\"(\w+)\">', content)[0]
        retry = 1
        while True:
            time.sleep(random.uniform(0.5, 1.2))
            logger.info("获取验证码")
            capt = {}
            resp = session.get(url=captcha_url.format(captcha_0),
                             headers=dict(header2, **{"Cookie": header2["Cookie"].format(csrftoken)}), impersonate="chrome124")
            content = resp.content
            with open("static/image.jpg", "wb") as f:
                f.write(content)
            for i in range(30):
                _captcha_1 = ocr.classification(content).lower()
                if bool(re.match(r'^[a-zA-Z0-9]{4}$', _captcha_1)):
                    if capt.get(_captcha_1):
                        capt[_captcha_1] += 1
                    else:
                        capt[_captcha_1] = 1
            if len(capt) == 0:
                retry = 99
                captcha_1 = "等待手动"
                print("自动处理验证码失败")
                print("开始等待手动id....")
            else:
                captcha_1 = max(capt, key=capt.get)
                print("captcha_1", captcha_1, "次数:", capt.get(captcha_1))

            print("captcha_0", captcha_0)
            cache[input_email] = {"auto": captcha_1}

            while True and retry > 3:
                ids = cache[input_email].get("sd")
                if ids and bool(re.match(r'^[a-zA-Z0-9]{4}$', ids)):
                    print(f"手动id：{ids} 自动：{captcha_1}")
                    captcha_1 = ids
                    break
                time.sleep(1)

            data = f"csrfmiddlewaretoken={csrftoken}&first_name={first_name}&last_name={last_name}&username={username}&email={quote(email)}&captcha_0={captcha_0}&captcha_1={captcha_1}&question=0&tos=on"
            time.sleep(random.uniform(0.5, 1.2))
            logger.info("请求信息")
            resp = session.post(url=url3, headers=dict(header3, **{"Cookie": header3["Cookie"].format(csrftoken)}),
                                data=data, impersonate="chrome124")
            print(resp.status_code)
            print(resp.text)
            content = resp.json()
            if content.get("captcha") and content["captcha"][0] == "Invalid CAPTCHA":
                captcha_0 = content["__captcha_key"]
                retry += 1
                logger.warning("验证码错误，正在重新获取")
                time.sleep(random.uniform(0.5, 1.2))
                continue
            else:
                break

    cache[input_email].clear()
    os.remove("static/image.jpg")


if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8080)
