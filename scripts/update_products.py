#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Go Shoot — 蝦皮熱門商品更新腳本
產出 products.json 給 shop.html 使用。

資料來源：蝦皮官方聯盟行銷（Shopee Affiliate Open API）。
⚠️ 請勿改成爬取蝦皮網站 —— 違反服務條款、會被封 IP、版面常改不穩定。
   官方 API 才能長久運作，而且能順便賺聯盟佣金。

放在 repo 的 scripts/ 底下，由 .github/workflows/update-products.yml 每月自動執行。
"""

import json, os, time, pathlib, urllib.request

# ============ 設定（可自行調整）============
OUTPUT_JSON = "products.json"
IMG_DIR     = "assets/photos"
TOP_N       = 100

# 想抓的關鍵字／類別：
#   想「逼近全站熱門」→ 放多個大類別關鍵字
#   想服務選物／一番賞選品 → 聚焦玩具類即可
KEYWORDS = ["戰鬥陀螺", "Beyblade", "公仔", "扭蛋", "模型"]

# 蝦皮 Affiliate API 憑證（放 GitHub Secrets，不要寫死在程式裡）
APP_ID     = os.environ.get("SHOPEE_APP_ID", "")
APP_SECRET = os.environ.get("SHOPEE_APP_SECRET", "")


def fetch_from_shopee_affiliate(keyword, limit):
    """
    TODO：串接蝦皮官方聯盟行銷 Open API（GraphQL）。

    申請步驟：
      1. 到 https://affiliate.shopee.tw/ 註冊並通過審核
      2. 開放平台 → 取得 App ID / App Secret
      3. 用官方簽章規則組 header，打 GraphQL endpoint
         （端點與簽章方式請以蝦皮官方最新文件為準）

    需回傳 list[dict]，每筆至少包含：
      { "name": 商品名, "price": "NT$xxx", "image": 圖片網址, "url": 導購連結, "sales": 銷量(int) }

    串好之前先回傳空 list（這樣整個流程可先跑通）。
    """
    # === 串接範例（虛擬碼，待你依官方文件實作）===
    # import hmac, hashlib, requests
    # ts = int(time.time())
    # payload = {"query": f'''{{ productOfferV2(keyword:"{keyword}", sortType:2, limit:{limit}) {{
    #              nodes {{ productName priceMin imageUrl offerLink sales }} }} }}'''}
    # base = f"{APP_ID}{ts}{json.dumps(payload)}{APP_SECRET}"
    # sign = hashlib.sha256(base.encode()).hexdigest()
    # headers = {"Authorization": f"SHA256 Credential={APP_ID}, Timestamp={ts}, Signature={sign}",
    #            "Content-Type": "application/json"}
    # r = requests.post("https://open-api.affiliate.shopee.tw/graphql", json=payload, headers=headers, timeout=30)
    # nodes = r.json()["data"]["productOfferV2"]["nodes"]
    # return [{"name": n["productName"], "price": f'NT${n["priceMin"]}',
    #          "image": n["imageUrl"], "url": n["offerLink"], "sales": n.get("sales",0)} for n in nodes]
    return []


def download_image(url, idx):
    """把商品圖下載到本地，避免盜連蝦皮 CDN（會破圖也違規）。檔名固定，每月覆蓋、不會肥大。"""
    try:
        pathlib.Path(IMG_DIR).mkdir(parents=True, exist_ok=True)
        path = os.path.join(IMG_DIR, f"hot-{idx:03d}.jpg")
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as r, open(path, "wb") as f:
            f.write(r.read())
        return path
    except Exception as e:
        print("圖片下載失敗，改用原網址：", e)
        return url


def main():
    items, seen = [], set()
    for kw in KEYWORDS:
        for p in fetch_from_shopee_affiliate(kw, 50):
            url = p.get("url")
            if not url or url in seen:
                continue
            seen.add(url)
            items.append(p)

    # 依銷量排序，取前 N
    items.sort(key=lambda x: x.get("sales", 0), reverse=True)
    items = items[:TOP_N]

    products = []
    for i, p in enumerate(items, 1):
        img = p.get("image", "")
        local = download_image(img, i) if img else ""
        products.append({
            "rank":  i,
            "name":  p.get("name", "商品"),
            "price": p.get("price", ""),
            "image": local or img,
            "url":   p.get("url", "#"),
        })

    data = {
        "updated":  time.strftime("%Y-%m"),
        "source":   "蝦皮聯盟行銷",
        "products": products,
    }

    if not products:
        print("⚠️ 沒有抓到商品：請先在 fetch_from_shopee_affiliate() 串接官方 API。")
        print("   （未串接前不覆蓋既有 products.json，避免清空頁面）")
        return

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ 已寫入 {len(products)} 筆商品到 {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
