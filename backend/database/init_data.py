from security import get_password_hash
from sqlalchemy.orm import Session
from datetime import datetime
from .models import Org, HotTopic

def init_org_data(db: Session):
    """初始化组织数据"""
    # 检查是否已存在组织
    existing_org = db.query(Org).filter(Org.orgCode == "36909").first()
    if existing_org:
        return
    
    # 创建默认组织
    org = Org(
        orgCode="36908",
        orgName="集约运营中心（广东）",
        password=get_password_hash("123456"),
        isFirstLogin=True,
        passwordLastChanged=datetime.now(),
    )
    db.add(org)
    # 创建默认组织
    org = Org(
        orgCode="36909",
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
    existing_topics = db.query(HotTopic).first()
    if existing_topics:
        return
    
    # 创建默认热门话题
    topics = [
        HotTopic(
            description="如何办理对公账户开户？",
            icon="1",
            order=1
        ),
        HotTopic(
            description="企业网银如何开通？",
            icon="2",
            order=2
        ),
        HotTopic(
            description="对公转账限额是多少？",
            icon="3",
            order=3
        ),
        HotTopic(
            description="如何申请企业贷款？",
            icon="4",
            order=4
        ),
        HotTopic(
            description="企业理财有哪些产品？",
            icon="5",
            order=5
        )
    ]
    
    for topic in topics:
        db.add(topic)
    
    db.commit()


def init_all_data(db: Session):
    """初始化所有数据"""
    init_org_data(db)
    init_hot_topics(db) 