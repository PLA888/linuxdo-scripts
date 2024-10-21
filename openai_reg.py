# 源自：https://linux.do/t/topic/237353   [需要干净 ip]【简陋的 openai 注册机】GitHub 已开源   代理池暂时没加入 注册几个之后请换个 ip 继续
import time
from urllib.parse import unquote
import html
import random
import requests
import re
from faker import Faker
from playwright.sync_api import sync_playwright

# 临时邮箱API的域名
domain = "https://api.mail.cx/api/v1"

# 生成随机用户名
def generate_name():
    fake = Faker('en_US')
    while True:
        name = fake.name().replace(' ', '_')
        if len(name) <= 10:
            return name

# 生成随机IP地址
def generate_random_ip():
    return '.'.join([str(random.randint(0, 255)) for _ in range(4)])

# 获取授权Token
def getAuth():
    url = domain + "/auth/authorize_token"
    headers = {
        'accept': 'application/json',
        'Authorization': 'Bearer undefined',
        'X-Real-IP': generate_random_ip()
    }

    response = requests.post(url, headers=headers)
    return str(response.json())

# 生成随机邮箱地址
def getMailAddress():
    root_mail = ["nqmo.com"]
    return generate_name() + '@' + random.choice(root_mail)

# 获取邮箱ID
def getMailId(address, auth):
    url = domain + f"/mailbox/{address}"
    headers = {
        'accept': 'application/json',
        'Authorization': f'Bearer {auth}',
        'X-Real-IP': generate_random_ip()
    }
    response = requests.get(url, headers=headers)
    body = response.json()
    return body[0]['id'] if len(body) and len(body[0]['id']) > 0 else None

def decode_url(encoded_url):
    url_decoded = unquote(encoded_url)
    url_decoded = html.unescape(url_decoded)
    return url_decoded

def open_page_with_stealth():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        js = """Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        })"""
        context.add_init_script(js)
        page = context.new_page()
        page.goto("https://chatgpt.com/")

        try:
            page.locator("text=注册").first.click()
            #print("已打开注册页面")
        except Exception as e:
            print("未找到 '注册' 按钮，尝试点击 '创建新帐户'")
            try:
                page.locator("text=创建新帐户").click()
                #print("已打开创建新帐户页面")
            except Exception as e:
                print(f"未找到 '创建新帐户' 按钮: {e}")

        # 取邮箱填入并点击注册按钮
        auth = getAuth()
        email = getMailAddress()
        page.locator('xpath=//*[@id="email-input"]').fill(email)
        print("邮箱地址: " + email)
        page.locator("text=继续").nth(1).click()
        #print("已点击注册按钮")

        # 输入密码
        page.locator('xpath=//*[@id="password"]').fill("Qwqwe1234567890")
        print("密码: Qwqwe1234567890")
        page.locator("text=继续").nth(2).click()
        #print("已发送验证邮件")

        # 接收邮件
        id_ = None
        while id_ is None:
            id_ = getMailId(email, auth)
        url = domain + f'/mailbox/{email}/{id_}'
        headers = {
            'accept': 'application/json',
            'Authorization': f'Bearer {auth}',
            'X-Real-IP': generate_random_ip()
        }
        email_body = requests.get(url, headers=headers).json()["body"]["text"]
        pattern = r'https://[^\s<>"]+'
        match = re.search(pattern, email_body)
        verify_url = match.group()
        decoded_verify_url = decode_url(verify_url)
        #print("已获取验证链接: " + decoded_verify_url)

        # 打开验证链接
        page.goto(decoded_verify_url)

        # 登录验证
        page.locator("text=登录").click()
        page.locator('xpath=//*[@id="email-input"]').fill(email)
        #print("已填入邮箱地址 邮箱地址: " + email)
        page.locator("text=继续").nth(1).click()
        #print("已点击注册按钮")
        page.locator('xpath=//*[@id="password"]').fill("Qwqwe1234567890")
        #print("已填入密码 密码: Qwqwe1234567890")
        page.locator("text=继续").nth(2).click()
        time.sleep(1)
        page.locator('xpath=//*[@id="root"]/div[1]/div[2]/div/form/div[1]/div[1]/input').fill("Meat")
        page.locator('xpath=//*[@id="root"]/div[1]/div[2]/div/form/div[1]/div[3]/div/div/input').fill("11/02/1971")
        page.locator("text=同意").nth(1).click()
        print("已完成注册")

for i in range(50):
    open_page_with_stealth()
