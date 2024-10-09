# 源自：自动获取 accessToken   https://linux.do/t/topic/226224
import json
from DrissionPage import ChromiumPage, ChromiumOptions
from DrissionPage._elements.chromium_element import ChromiumElement # type: ignore
import time
import requests

def options_default() -> ChromiumOptions:
    co = ChromiumOptions()
    co.headless(False)
    return co

def el(el: ChromiumPage, find_str: str, is_list: bool = False) -> ChromiumElement | list[ChromiumElement]:
    try:
        if is_list:
            node = el.eles(find_str, timeout=0.1)
        else:
            node = el.ele(find_str, timeout=0.1)
        if node:
            return node
    except Exception as e:
        return False
        

class ChatGPT_Auth:
   
    url: str = 'https://chatgpt.com'
    account_pool_path: str = 'zhang.txt' #账号 （方式：email:password）
    accurl : str = 'https://chat.openai.com/api/auth/session'
    tokens_path: str = 'tk2.txt'
    
    page: ChromiumPage = None
    
    def init(self):
        options = options_default()
        options.incognito(True)
        options.headless(False)
        options.set_proxy("127.0.0.1:7897")
        self.page = ChromiumPage(options)
        pass
    
    def remove_line_with_credentials(self, username, password):
        with open(self.account_pool_path, 'r+') as file:
            lines = file.readlines()
            file.seek(0)
            for line in lines:
                if f"{username}:{password}" not in line:
                    file.write(line)
            file.truncate()
    def login_loop(self) -> list:
        with open(self.account_pool_path, 'r') as f:
            for line in f.readlines():
                account = line.strip()
                if not account:
                    continue
                account_items = account.split(':')
                email = account_items[0]
                password = account_items[1]
                print(email, password)
                # 打开网页
                self.init()
                self.page.get(self.url)
                time.sleep(2)
                
                while True:
                    email = account_items[0]
                    password = account_items[1]
                    try:
                        if self.login(email, password):
                            break
                    except Exception as e:
                        print(e)
                        break
                    time.sleep(1)
        
        
    def login(self, email, password):
        try:
            iframe= el(self.page, 'xpath://div/iframe') #cf盾
            if iframe !=None:
                print(f"iframe:{iframe}")
                if iframe.ele(".cf-chl-widget-z4zii", timeout=2.5):
                    time.sleep(2)
                    print('cf盾中...')
                elif iframe.ele("确认您是真人", timeout=2.5):
                    cb_lb = iframe.ele("确认您是真人", timeout=2.5)
                    if cb_lb != None:
                        cb_lb.click()
        except Exception as e:           
            print(e)
            time.sleep(2)
                
        # 点击跳转登录页
        btn_relative_btn = el(self.page, ".btn relative btn-blue btn-large")
        print(btn_relative_btn)
        if  btn_relative_btn:
            btn_relative_btn.click()
        login_btn_el = el(self.page, ".btn relative btn-secondary")
        print(login_btn_el)
        if login_btn_el != None:
            login_btn_el.click()
        
        # 输入邮箱
        email_input_el = el(self.page, '#email-input')
        print(email_input_el)
        if email_input_el != None:
            time.sleep(1)
            email_input_el.clear()
            if not email_input_el.value:
                email_input_el.input(email)
            print(f'正在输入邮箱: {email}')
            
            # 点击继续
            continue_btn_el = el(self.page, '.continue-btn')
            if continue_btn_el != None:
                print('点击继续...')
                continue_btn_el.click()

        password_el = el(self.page, '#password')
        if password_el != None:
            password_el.clear()
            if not password_el.value:
                password_el.input(password)
            print(f'正在输入密码: {password}')
            prompt_alert = el(self.page,'#prompt-alert')   # 帐户存在潜在安全问题  
            if prompt_alert !=None: 
                self.remove_line_with_credentials(email,password)
                return True 
            erpa = el(self.page, '#error-element-password') #账号被封禁
            if erpa != None:
                self.remove_line_with_credentials(email,password)
                return True 
                
            # 点击继续
            pwd_continue_btn_el = el(self.page, '@name=action')
            if pwd_continue_btn_el != None:
                print('点击继续...')
                pwd_continue_btn_el.click()
            time.sleep(2)    
            erpass = el(self.page,'.mb-5 text-center')
            print(erpass)
            if erpass != None:
                print("You do not have an account because it has been deleted or deactivated.")
                self.remove_line_with_credentials(email,password)
                return True
            code = el(self.page,'#code')
            if code != None:
                return True
        user_alt_el = el(self.page, '@alt=User')
        if user_alt_el != None:
            # token = self.page.cookies(as_dict=True)['__Secure-next-auth.session-token']
            self.page.get(self.accurl)
            pre = el(self.page, "tag:pre",is_list=False)
            if pre != None:
                #print(pre)
                #print(pre.text)
                acc = pre.text
                data = json.loads(acc)
                token = data["accessToken"]
                #print(accessToken)
                print(f"{email} - 登录成功", token)
                with open(self.tokens_path, 'a') as f:
                    f.write(token + '\n')
                self.page.close()
                print('--------------------------------------------------')
                return True
        
       
if __name__ == '__main__':
    chat = ChatGPT_Auth()
    chat.login_loop()
