import json
import base64
import urllib.parse


def convert_bytes_to_readable_unit(bytes_value):
    """将字节值转换为可读单位（MB、GB、TB）。"""
    GB = 1073741824
    TB = 1099511627776
    MB = 1048576

    if bytes_value >= TB:
        return f"{bytes_value / TB:.2f} TB"
    elif bytes_value >= GB:
        return f"{bytes_value / GB:.2f} GB"
    else:
        return f"{bytes_value / MB:.2f} MB"


def get_all_data(type):
    if "netTraffic" in type["obj"]:
        sent = convert_bytes_to_readable_unit(type["obj"]["netTraffic"]["sent"])
        recv = convert_bytes_to_readable_unit(type["obj"]["netTraffic"]["recv"])
    if "xray" in type["obj"]:
        state = type["obj"]["xray"]["state"]
        version = type["obj"]["xray"]["version"]

    return sent, recv, state, version


def generate_subscription_links(data, ip_address):
    links = []
    expiry_times = []
    traffic_limits = []

    if data["success"]:
        for item in data["obj"]:
            if item["enable"]:
                protocol = item["protocol"]
                prot = item["port"]
                link = ""
                if protocol == "vless":
                    settings = json.loads(item["settings"])
                    client_id = settings["clients"][0]["id"]
                    flow = settings["clients"][0].get("flow", "")
                    stream_settings = json.loads(item["streamSettings"])
                    network = stream_settings["network"]
                    security = stream_settings["security"]
                    ws_settings = stream_settings.get("wsSettings", {})
                    path = ws_settings.get("path", "/")
                    query = f"type={network}&security={security}&path={urllib.parse.quote(path)}"
                    if flow:
                        query += f"&flow={flow}"
                    link = f"{protocol}://{client_id}@{ip_address}:{prot}?{query}"
                elif protocol == "vmess":
                    settings = json.loads(item["settings"])
                    client_id = settings["clients"][0]["id"]
                    stream_settings = json.loads(item["streamSettings"])
                    network = stream_settings["network"]
                    ws_settings = stream_settings.get("wsSettings", {})
                    path = ws_settings.get("path", "/")
                    vmess_config = {
                        "v": "2",
                        "ps": item["tag"],
                        "add": ip_address,
                        "port": item["port"],
                        "id": client_id,
                        "aid": "0",
                        "net": network,
                        "type": "none",
                        "host": "",
                        "path": path,
                        "tls": "",
                    }
                    link = f"vmess://{base64.urlsafe_b64encode(json.dumps(vmess_config).encode()).decode().strip('=')}"
                elif protocol == "trojan":
                    settings = json.loads(item["settings"])
                    client_id = settings["clients"][0]["password"]
                    link = f"trojan://{client_id}@{ip_address}:{prot}"
                elif protocol == "shadowsocks":
                    settings = json.loads(item["settings"])
                    method = settings["method"]
                    password = settings["password"]
                    link = f"ss://{base64.urlsafe_b64encode(f'{method}:{password}@{ip_address}:{prot}'.encode()).decode().strip('=')}"
                elif protocol == "http":
                    settings = json.loads(item["settings"])
                    user = settings["accounts"][0]["user"]
                    password = settings["accounts"][0]["pass"]
                    link = f"{protocol}://{user}:{password}@{ip_address}:{prot}"
                elif protocol == "socks":
                    settings = json.loads(item["settings"])
                    user = settings["accounts"][0]["user"]
                    password = settings["accounts"][0]["pass"]
                    ip = settings["ip"]
                    link = f"{protocol}://{user}:{password}@{ip}:{prot}"

                links.append(link)
                expiry_times.append(item["expiryTime"])
                traffic_limits.append(item["total"])

    return links, expiry_times, traffic_limits
