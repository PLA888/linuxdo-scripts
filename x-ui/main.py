import threading
import json
import re
from tools import get_all_data, generate_subscription_links
from xuiapi import getSession, get_server_status, get_inbound_list
from tqdm import tqdm


def start(url):
    ip_pattern = r"\b(?:\d{1,3}\.){3}\d{1,3}\b"
    server_obj = {
        "xrayState": False,  # xray状态
        "xrayVersion": "",  # xray 版本号
        "uptime": "",  # 运行时间
        "sent": "",  # 上行总流量
        "recv": "",  # 下行总流量
        "link": "",  # 连接
        "expiry": "",  # 到期时间
        "traffic": "",  # 流量限制
    }
    try:
        session = getSession(url)
        type = get_server_status(url, session)
        if type is None:
            return server_obj
        sent, recv, state, version = get_all_data(type=type)
        server_obj["recv"] = recv
        server_obj["sent"] = sent
        server_obj["xrayState"] = state
        server_obj["xrayVersion"] = version

        if "appStats" in type["obj"]:
            pass
        else:
            inboundList = get_inbound_list(url, session)
            links, expiry_times, traffic_limits = generate_subscription_links(
                inboundList, re.search(ip_pattern, url).group()
            )
            server_obj["link"] = links
            server_obj["expiry"] = expiry_times
            server_obj["traffic"] = traffic_limits
        return server_obj
    except Exception as err:
        return server_obj


def process_ips(ip_list, endArray, pbar):
    for ip in ip_list:
        result = start(ip)
        endArray.append(result)
        pbar.update(1)


def main():
    with open("./ips.txt") as f:
        ips = f.read().splitlines()

    endArray = []
    threads = []
    num_threads = 2
    ips_per_thread = len(ips) // num_threads

    # 创建一个进度条
    pbar = tqdm(total=len(ips), desc="Processing IPs")

    for i in range(num_threads):
        start_index = i * ips_per_thread
        if i == num_threads - 1:  # Make sure the last thread gets any remaining IPs
            end_index = len(ips)
        else:
            end_index = (i + 1) * ips_per_thread
        ip_subset = ips[start_index:end_index]
        thread = threading.Thread(target=process_ips, args=(ip_subset, endArray, pbar))
        threads.append(thread)
        thread.start()

    for thread in threads:
        thread.join()

    pbar.close()

    with open("./output.json", "w") as f:
        json.dump(endArray, f, indent=4)


if __name__ == "__main__":
    main()
