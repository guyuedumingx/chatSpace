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
            # if part.endswith('省'):
            #     masked += '**省'
            # elif part.endswith('市'):
            #     masked += '**市'
            # elif part.endswith('区'):
            #     masked += '**区'
            # elif part.endswith('县'):
            #     masked += '**县'
            if part.endswith('镇'):
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
    if len(number) < 9:
        return number
    return number[:2] + '*' * (len(number) - 4) + number[-2:]

def mask_email(email: str) -> str:
    # 邮箱掩码：保留首字母和@后域名
    parts = email.split('@')
    if len(parts) == 2 and len(parts[0]) > 2:
        return parts[0][0] + '*' * (len(parts[0]) - 2) + parts[0][-1] + '@' + parts[1]
    return email

def mask_name(name: str) -> str:
    """
    姓名掩码处理
    规则：匹配"名称/姓名："、"名称/姓名是"、"名称/姓名为"后面的字符，用*代替
    例如：
    "姓名：张三" -> "姓名：***"
    "名称是李四" -> "名称是***"
    "姓名为王五" -> "姓名为***"
    "姓名：张" -> "姓名：*"
    "姓名：张李" -> "姓名：**"
    "姓名：张三姓名：李四" -> "姓名：***姓名：***"
    """
    if not isinstance(name, str):
        return name

    # 定义需要匹配的模式
    patterns = [
        (r'(名称：)(.+?)(?=名称：|姓名：|名称是|姓名是|名称为|姓名为|$)', lambda m: m.group(1) + '*' * min(3, len(m.group(2)))),  # 匹配"名称："后面的任意字符
        (r'(姓名：)(.+?)(?=名称：|姓名：|名称是|姓名是|名称为|姓名为|$)', lambda m: m.group(1) + '*' * min(3, len(m.group(2)))),  # 匹配"姓名："后面的任意字符
        (r'(名称是)(.+?)(?=名称：|姓名：|名称是|姓名是|名称为|姓名为|$)', lambda m: m.group(1) + '*' * min(3, len(m.group(2)))),  # 匹配"名称是"后面的任意字符
        (r'(姓名是)(.+?)(?=名称：|姓名：|名称是|姓名是|名称为|姓名为|$)', lambda m: m.group(1) + '*' * min(3, len(m.group(2)))),  # 匹配"姓名是"后面的任意字符
        (r'(名称为)(.+?)(?=名称：|姓名：|名称是|姓名是|名称为|姓名为|$)', lambda m: m.group(1) + '*' * min(3, len(m.group(2)))),  # 匹配"名称为"后面的任意字符
        (r'(姓名为)(.+?)(?=名称：|姓名：|名称是|姓名是|名称为|姓名为|$)', lambda m: m.group(1) + '*' * min(3, len(m.group(2)))),  # 匹配"姓名为"后面的任意字符
    ]

    result = name
    for pattern, replacement in patterns:
        # 使用 re.sub 替换所有匹配项
        result = re.sub(pattern, replacement, result)

    return result

def mask_sensitive(text: str) -> str:
    # 银行卡号/账号/身份证（8位及以上连续数字）
    text = re.sub(r'\d{9,}', lambda m: mask_long_number(m.group()), text)
    # 姓名
    text = mask_name(text)
    #公司名称
    text=mask_company_name(text)
    # 邮箱
    text = re.sub(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', lambda m: mask_email(m.group()), text)
    # 地址（省市区县镇乡街道村，支持多级）
    text = re.sub(r'[\u4e00-\u9fa5]{2,}省[\u4e00-\u9fa5]{2,}市([\u4e00-\u9fa5]{2,}(区|县|镇|乡|街道|村))?', lambda m: mask_address(m.group()), text)
    return text

def mask_company_name(company: str) -> str:
    """
    对公司名进行掩码处理
    中文规则：匹配"有限"、"银行"等后缀，前六个字符用*代替
    英文规则：匹配"co.,ltd"、"company"等后缀，前面所有字符用*代替
    """
    if not isinstance(company, str):
        return company

    # 中文公司名掩码规则
    cn_patterns = [
        r'(.*?)(有限|银行|医院|合伙|集团|馆|铺|店|行|室|中心|厂|社|部|所|会)(公司)?',
    ]
    
    # 英文公司名掩码规则
    en_patterns = [
        r'(.*?)(co\.?\,?\s*ltd\.?|company|limited|Corporation|corp\.?|Factory|fty\.?|Incorporated|inc\.?|LLC|PLC)',
    ]

    result = company
    # 处理中文公司名
    for pattern in cn_patterns:
        # 使用 re.finditer 找到所有匹配项
        matches = list(re.finditer(pattern, result, re.IGNORECASE))
        # 从后向前处理，避免位置偏移
        for match in reversed(matches):
            prefix = match.group(1)
            suffix = match.group(2)
            company_suffix = match.group(3) or ''
            # 修改掩码逻辑，确保前缀部分完全掩码
            if len(prefix) > 6:
                masked = '*' * 6 + '*' * (len(prefix) - 6) + suffix + company_suffix
            else:
                masked = '*' * len(prefix) + suffix + company_suffix
            # 替换匹配到的部分
            result = result[:match.start()] + masked + result[match.end():]

    # 处理英文公司名
    for pattern in en_patterns:
        matches = list(re.finditer(pattern, result, re.IGNORECASE))
        for match in reversed(matches):
            prefix = match.group(1)
            suffix = match.group(2)
            masked = '*' * len(prefix) + suffix
            result = result[:match.start()] + masked + result[match.end():]

    return result

# 测试用例
# test_cases = [
#     "姓名：张三qwe姓名是往往",
#     "名称是李四",
#     "姓名为王五",
#     "名称：赵六",
#     "姓名是钱七",
#     "名称为孙八",
#     "普通文本",
#     "姓名：张三姓名：李四",  # 测试多个匹配
#     "姓名：张三123",  # 测试非汉字
#     "姓名：张",  # 测试1个字符
#     "姓名：张李",  # 测试2个字符
# ]

# # 运行测试
# for test in test_cases:
#     print(f"输入: {test}")
#     print(f"输出: {mask_name(test)}")
#     print("---")



