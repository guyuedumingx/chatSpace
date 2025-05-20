import re

def mask_address(address: str) -> str:
    # 只保留"省""市""区"等后缀，前面全部用*号
    # 匹配省、市、区等行政区划
    pattern = r'(.*?省)?(.*?市)?(.*?区)?(.*?县)?(.*?镇)?(.*?乡)?(.*?街道)?(.*?村)?$'
    match = re.match(pattern, address)
    if not match:
        return address
    parts = match.groups()
    masked = ''
    for part in parts:
        if part:
            # 只保留后缀
            if part.endswith('省'):
                masked += '**省'
            elif part.endswith('市'):
                masked += '**市'
            elif part.endswith('区'):
                masked += '**区'
            elif part.endswith('县'):
                masked += '**县'
            elif part.endswith('镇'):
                masked += '**镇'
            elif part.endswith('乡'):
                masked += '**乡'
            elif part.endswith('街道'):
                masked += '**街道'
            elif part.endswith('村'):
                masked += '**村'
    return masked if masked else address

def mask_long_number(number: str) -> str:
    if not isinstance(number, str):
        number = str(number)
    if len(number) < 8:
        return number
    return number[:2] + '*' * (len(number) - 4) + number[-2:]

def mask_email(email: str) -> str:
    # 邮箱掩码：保留首字母和@后域名
    parts = email.split('@')
    if len(parts) == 2 and len(parts[0]) > 2:
        return parts[0][0] + '*' * (len(parts[0]) - 2) + parts[0][-1] + '@' + parts[1]
    return email

def mask_sensitive(text: str) -> str:
    # 手机号（11位1开头数字）
    text = re.sub(r'1\d{10}', lambda m: mask_long_number(m.group()), text)
    # 银行卡号/账号/身份证（8位及以上连续数字）
    text = re.sub(r'\d{8,}', lambda m: mask_long_number(m.group()), text)
    # 邮箱
    text = re.sub(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', lambda m: mask_email(m.group()), text)
    # 地址（省市区县镇乡街道村，支持多级）
    text = re.sub(r'[\u4e00-\u9fa5]{2,}省[\u4e00-\u9fa5]{2,}市([\u4e00-\u9fa5]{2,}(区|县|镇|乡|街道|村))?', lambda m: mask_address(m.group()), text)
    return text
