import os
from whoosh.index import create_in, open_dir
from whoosh.fields import Schema, TEXT, ID, NUMERIC, KEYWORD
from whoosh.qparser import QueryParser, MultifieldParser, OrGroup, WildcardPlugin, PrefixPlugin
from whoosh.analysis import StandardAnalyzer, Analyzer, Token, RegexTokenizer
from whoosh.query import Term, Or, Prefix, Wildcard
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import jieba
import re
from database.config import INDEX_DIR

from database.models import Topic

# 创建中文分词器
class ChineseAnalyzer(Analyzer):
    def __call__(self, text, **kargs):
        words = jieba.cut(text)
        token_stream = []
        position = 0
        for w in words:
            # 创建 Token 对象并设置 pos 属性
            token = Token(text=w, pos=position)
            token_stream.append(token)
            position += 1
        return token_stream

# 定义Schema - 修改trcd和inTrcd为KEYWORD类型以支持前缀搜索
topic_schema = Schema(
    id=ID(stored=True),
    topic_id=ID(stored=True),
    description=TEXT(stored=True, analyzer=ChineseAnalyzer()),
    keywords=TEXT(stored=True, analyzer=ChineseAnalyzer()),
    in_trcd=KEYWORD(stored=True, commas=True),
    trcd=KEYWORD(stored=True, commas=True),
    topic_type=TEXT(stored=True, analyzer=ChineseAnalyzer()),
    operator=TEXT(stored=True, analyzer=ChineseAnalyzer()),
    addition=TEXT(stored=True, analyzer=ChineseAnalyzer()),
)

def create_index(db: Session):
    """创建Topic表的索引"""
    # 创建索引
    ix = create_in(INDEX_DIR, schema=topic_schema)
    
    # 获取writer
    writer = ix.writer()
    
    # 获取所有未删除的Topic
    topics = db.query(Topic).filter(Topic.isDeleted == False).all()
    
    # 将Topic添加到索引
    for topic in topics:
        writer.add_document(
            id=str(topic.id),
            topic_id=topic.topicId,
            description=topic.description,
            keywords=topic.keywords or "",
            in_trcd=topic.inTrcd,
            trcd=topic.trcd,
            topic_type=topic.topicType,
            operator=topic.operator,
            addition=topic.addition,
        )
    
    # 提交更改
    writer.commit()

def update_index(topic: Topic):
    """更新单个Topic索引"""
    try:
        ix = open_dir(INDEX_DIR)
        writer = ix.writer()
        
        # 首先删除现有文档（如果存在）
        writer.delete_by_term('topic_id', topic.topicId)
        
        # 添加新文档
        writer.add_document(
            id=str(topic.id),
            topic_id=topic.topicId,
            description=topic.description,
            keywords=topic.keywords or "",
            in_trcd=topic.inTrcd,
            trcd=topic.trcd,
            topic_type=topic.topicType,
            operator=topic.operator,
            addition=topic.addition,
        )
        
        writer.commit()
        return True
    except Exception as e:
        print(f"更新索引出错: {str(e)}")
        return False

def delete_from_index(topic_id: str):
    """从索引中删除Topic"""
    try:
        ix = open_dir(INDEX_DIR)
        writer = ix.writer()
        writer.delete_by_term('topic_id', topic_id)
        writer.commit()
        return True
    except Exception as e:
        print(f"从索引中删除出错: {str(e)}")
        return False

def search_topics(query_string: str, limit: int = 10) -> List[Dict[str, Any]]:
    """搜索Topics
    
    Args:
        query_string: 搜索关键词
        limit: 返回结果数量上限
        
    Returns:
        匹配的Topic列表
    """
    try:
        # 确保索引目录存在
        if not os.path.exists(INDEX_DIR) or not os.listdir(INDEX_DIR):
            return []
            
        # 打开索引
        ix = open_dir(INDEX_DIR)
        
        # 对查询词进行中文分词
        terms = ' OR '.join(jieba.cut(query_string))
        search_query = terms if terms else query_string
        
        # 检查是否有数字，用于前缀匹配
        has_digits = bool(re.search(r'\d', query_string))
        
        with ix.searcher() as searcher:
            # 构建查询
            queries = []
            
            # 1. 常规多字段搜索
            # parser = MultifieldParser(["description", "keywords", "operator", "topic_type"], 
            #                          ix.schema, 
            #                          group=OrGroup.factory(0.9))
            parser = MultifieldParser(["description", "keywords", "topic_type"], 
                                     ix.schema, 
                                     group=OrGroup.factory(0.9))
            parser.add_plugin(WildcardPlugin())
            parser.add_plugin(PrefixPlugin())
            queries.append(parser.parse(search_query))
            
            # 2. 如果查询包含数字，添加trcd和in_trcd的前缀匹配和通配符匹配
            if has_digits:
                # 提取查询中的数字
                digits = ''.join(re.findall(r'\d+', query_string))
                if digits:
                    # 添加前缀匹配
                    queries.append(Or([Prefix("trcd", digits), Prefix("in_trcd", digits)]))
                    # 添加通配符匹配 (例如: *21076*)
                    queries.append(Or([Wildcard("trcd", f"*{digits}*"), Wildcard("in_trcd", f"*{digits}*")]))
            
            # 组合所有查询为一个OR查询
            combined_query = Or(queries)
            
            # 执行搜索
            results = searcher.search(combined_query, limit=limit)
            
            # 格式化返回结果
            topics = []
            for hit in results:
                topics.append({
                    "id": hit["id"],
                    "topicId": hit["topic_id"],
                    "description": hit["description"],
                    "inTrcd": hit["in_trcd"],
                    "trcd": hit["trcd"],
                    "topicType": hit["topic_type"],
                    "operator": hit["operator"],
                    "addition": hit["addition"],
                    "score": hit.score  # 添加相关性评分
                })
            
            # 根据评分排序
            topics.sort(key=lambda x: x["score"], reverse=True)
            
            return topics
    except Exception as e:
        print(f"搜索出错: {str(e)}")
        return []

def init_search_index(db: Session):
    """初始化搜索索引"""
    # 检查索引目录是否存在，如果不存在则创建
    if not os.path.exists(INDEX_DIR) or not os.listdir(INDEX_DIR):
        create_index(db) 