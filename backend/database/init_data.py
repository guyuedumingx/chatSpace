from security import get_password_hash
from sqlalchemy.orm import Session
from datetime import datetime
from .models import Org, Topic, Contact

def init_org_data(db: Session):
    """初始化组织数据"""
    # 检查是否已存在组织
    existing_org = db.query(Org).filter(Org.orgCode == "36909").first()
    if existing_org:
        return
    
    # 创建默认组织
    org = Org(
        orgCode="36909",
        orgName="集约运营中心（广东）",
        password=get_password_hash("123456"),
        isFirstLogin=True,
        passwordLastChanged=datetime.now(),
    )
    db.add(org)
    # 创建默认组织
    org = Org(
        orgCode="36908",
        orgName="集约运营中心（湖北）",
        password=get_password_hash("123456"),
        isFirstLogin=True,
        passwordLastChanged=datetime.now(),
    )
    db.add(org)
    db.commit()  # 先提交事务，确保实体被持久化
    db.refresh(org)


def init_hot_topics(db: Session):
    """初始化热门话题数据"""
    # 检查是否已存在热门话题
    existing_topics = db.query(Topic).first()
    if existing_topics:
        return
    
    # 创建默认热门话题
    topics = [
        Topic(
            description="如何办理对公账户开户？",
            inTrcd="021076",
            trcd="021076",
            topicType="交易画面录入",
            operator="情况一：常规录入\n将护照首页登记的姓名录入为英文名称，如有空格，按护照录入\n情况二：护照录入\n将护照首页登记的姓名录入为英文名称，如有空格，按护照录入\n情况三：护照录入\n将护照首页登记的姓名录入为英文名称，如有空格，按护照录入\n情况四：护照录入\n将护照首页登记的姓名录入为英文名称，如有空格，按护照录入\n",
            addition="关于发送《远程核准全国集中业务提示》的通知 接收网页邮件： 2023/09/14 17:38",
            keywords="护照录入,外国护照，常规，条形码",
            order=1
        ),
        Topic(
            description="企业网银如何开通？",
            inTrcd="037232",
            trcd="037232",
            topicType="交易画面录入",
            operator="关于账户开户，您需要准备A、B、C材料，然后前往任一网点办理。详情请咨询您的客户经理。",
            addition="关于发送《远程核准全国集中业务提示》的通知 接收网页邮件： 2023/09/14 17:38",
            keywords="账户,开户",
            order=2
        ),
        Topic(
            description="对公转账限额是多少？",
            inTrcd="055067",
            trcd="055067",
            topicType="交易画面录入",
            operator="企业网银可以通过我们的官方网站在线申请，或前往柜台由客户经理协助开通。具体流程请参考官网指南。",
            addition="关于发送《远程核准全国集中业务提示》的通知 接收网页邮件： 2023/09/14 17:38",
            keywords="网银,企业网银",
            order=3
        ),
        Topic(
            description="如何申请企业贷款？",
            inTrcd="055067",
            trcd="055067",
            topicType="交易画面录入",
            operator="企业贷款需要根据您的企业资质和经营情况进行评估，请联系您的客户经理或在线提交预审申请以获取更详细的信息。",
            addition="关于发送《远程核准全国集中业务提示》的通知 接收网页邮件： 2023/09/14 17:38",
            keywords="贷款,企业贷款",
            order=4
        ),
        Topic(
            description="密码相关咨询",
            inTrcd="021076",
            trcd="021076",
            topicType="交易画面录入",
            operator="关于登录密码，您可以前往柜台或通过手机银行App重置。关于交易密码，您可以前往柜台或通过手机银行App重置。",
            addition="关于发送《远程核准全国集中业务提示》的通知 接收网页邮件： 2023/09/14 17:38",
            keywords="密码,登录密码,交易密码",
            order=5
        ),
        Topic(
            description="支付密码相关问题",
            inTrcd="021076",
            trcd="021076",
            topicType="交易画面录入",
            operator="支付密码用于交易验证。如果您遇到支付密码问题，如忘记或锁定，请联系客服或前往柜台处理。",
            addition="关于发送《远程核准全国集中业务提示》的通知 接收网页邮件： 2023/09/14 17:38",
            keywords="支付密码,交易密码",
            order=6
        )
    ]
    
    for topic in topics:
        db.add(topic)
    
    db.commit()

def init_contacts(db: Session):
    """初始化热门话题数据"""
    # 检查是否已存在热门话题
    contact = db.query(Contact).first()
    if contact:
        return
    
    contacts = [
        Contact(
            contactName = "张三",
            contactPhone = "020-81889729"
        ),
        Contact(
            contactName = "李四",
            contactPhone = "020-81889792"
        )
    ]

    for con in contacts:
        db.add(con)
    db.commit()



def init_all_data(db: Session):
    """初始化所有数据"""
    init_org_data(db)
    init_hot_topics(db)
    init_contacts(db)
    
    # 导入在这里避免循环导入
    from search import init_search_index
    init_search_index(db) 