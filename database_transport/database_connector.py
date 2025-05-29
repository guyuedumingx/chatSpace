"""
数据库连接器模块
支持SQLite和SQL Server的连接和操作
"""

import sqlite3
import pyodbc
import pymssql
import pandas as pd
import logging
from typing import Dict, Any, Optional, List, Tuple
from abc import ABC, abstractmethod


class DatabaseConnector(ABC):
    """数据库连接器抽象基类"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.connection = None
        self.logger = logging.getLogger(__name__)
    
    @abstractmethod
    def connect(self) -> bool:
        """建立数据库连接"""
        pass
    
    @abstractmethod
    def disconnect(self):
        """关闭数据库连接"""
        pass
    
    @abstractmethod
    def get_tables(self) -> List[str]:
        """获取数据库中的所有表名"""
        pass
    
    @abstractmethod
    def get_table_schema(self, table_name: str) -> List[Tuple[str, str]]:
        """获取表结构 (列名, 数据类型)"""
        pass
    
    @abstractmethod
    def read_table(self, table_name: str, batch_size: int = None, offset: int = 0) -> pd.DataFrame:
        """读取表数据"""
        pass
    
    @abstractmethod
    def write_table(self, df: pd.DataFrame, table_name: str, if_exists: str = 'append'):
        """写入表数据"""
        pass
    
    @abstractmethod
    def create_table(self, table_name: str, schema: List[Tuple[str, str]]):
        """创建表"""
        pass
    
    @abstractmethod
    def table_exists(self, table_name: str) -> bool:
        """检查表是否存在"""
        pass
    
    @abstractmethod
    def truncate_table(self, table_name: str):
        """清空表数据"""
        pass


class SQLiteConnector(DatabaseConnector):
    """SQLite数据库连接器"""
    
    def connect(self) -> bool:
        try:
            database_path = self.config['connection']['database']
            self.connection = sqlite3.connect(database_path)
            self.logger.info(f"成功连接到SQLite数据库: {database_path}")
            return True
        except Exception as e:
            self.logger.error(f"连接SQLite数据库失败: {e}")
            return False
    
    def disconnect(self):
        if self.connection:
            self.connection.close()
            self.logger.info("SQLite连接已关闭")
    
    def get_tables(self) -> List[str]:
        cursor = self.connection.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        return tables
    
    def get_table_schema(self, table_name: str) -> List[Tuple[str, str]]:
        cursor = self.connection.cursor()
        cursor.execute(f"PRAGMA table_info({table_name})")
        schema = [(row[1], row[2]) for row in cursor.fetchall()]
        return schema
    
    def read_table(self, table_name: str, batch_size: int = None, offset: int = 0) -> pd.DataFrame:
        query = f"SELECT * FROM {table_name}"
        if batch_size:
            query += f" LIMIT {batch_size} OFFSET {offset}"
        return pd.read_sql_query(query, self.connection)
    
    def write_table(self, df: pd.DataFrame, table_name: str, if_exists: str = 'append'):
        df.to_sql(table_name, self.connection, if_exists=if_exists, index=False)
    
    def create_table(self, table_name: str, schema: List[Tuple[str, str]]):
        columns = [f"{col_name} {col_type}" for col_name, col_type in schema]
        create_sql = f"CREATE TABLE IF NOT EXISTS {table_name} ({', '.join(columns)})"
        cursor = self.connection.cursor()
        cursor.execute(create_sql)
        self.connection.commit()
    
    def table_exists(self, table_name: str) -> bool:
        cursor = self.connection.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        return cursor.fetchone() is not None
    
    def truncate_table(self, table_name: str):
        cursor = self.connection.cursor()
        cursor.execute(f"DELETE FROM {table_name}")
        self.connection.commit()


class SQLServerConnector(DatabaseConnector):
    """SQL Server数据库连接器"""
    
    def connect(self) -> bool:
        try:
            conn_config = self.config['connection']
            # 尝试使用pyodbc连接
            try:
                connection_string = (
                    f"DRIVER={{{conn_config.get('driver', 'ODBC Driver 17 for SQL Server')}}};"
                    f"SERVER={conn_config['server']},{conn_config.get('port', 1433)};"
                    f"DATABASE={conn_config['database']};"
                    f"UID={conn_config['username']};"
                    f"PWD={conn_config['password']}"
                )
                self.connection = pyodbc.connect(connection_string)
                self.logger.info(f"成功使用pyodbc连接到SQL Server: {conn_config['server']}")
                return True
            except Exception as pyodbc_error:
                self.logger.warning(f"pyodbc连接失败，尝试pymssql: {pyodbc_error}")
                # 备用方案：使用pymssql
                self.connection = pymssql.connect(
                    server=conn_config['server'],
                    user=conn_config['username'],
                    password=conn_config['password'],
                    database=conn_config['database'],
                    port=conn_config.get('port', 1433)
                )
                self.logger.info(f"成功使用pymssql连接到SQL Server: {conn_config['server']}")
                return True
        except Exception as e:
            self.logger.error(f"连接SQL Server数据库失败: {e}")
            return False
    
    def disconnect(self):
        if self.connection:
            self.connection.close()
            self.logger.info("SQL Server连接已关闭")
    
    def get_tables(self) -> List[str]:
        query = """
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        """
        df = pd.read_sql_query(query, self.connection)
        return df['TABLE_NAME'].tolist()
    
    def get_table_schema(self, table_name: str) -> List[Tuple[str, str]]:
        query = """
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
        """
        cursor = self.connection.cursor()
        cursor.execute(query, (table_name,))
        schema = [(row[0], row[1]) for row in cursor.fetchall()]
        return schema
    
    def read_table(self, table_name: str, batch_size: int = None, offset: int = 0) -> pd.DataFrame:
        query = f"SELECT * FROM {table_name}"
        if batch_size:
            query += f" ORDER BY (SELECT NULL) OFFSET {offset} ROWS FETCH NEXT {batch_size} ROWS ONLY"
        return pd.read_sql_query(query, self.connection)
    
    def write_table(self, df: pd.DataFrame, table_name: str, if_exists: str = 'append'):
        # SQL Server需要特殊处理
        if if_exists == 'replace' and self.table_exists(table_name):
            self.truncate_table(table_name)
        
        if df.empty:
            return
        
        # 使用手动插入方式避免pandas to_sql的兼容性问题
        cursor = self.connection.cursor()
        
        # 获取表结构来构建INSERT语句
        columns = df.columns.tolist()
        placeholders = ', '.join(['?' for _ in columns])
        column_names = ', '.join([f'[{col}]' for col in columns])
        
        insert_sql = f"INSERT INTO [{table_name}] ({column_names}) VALUES ({placeholders})"
        
        # 分批插入数据
        batch_size = 1000
        total_rows = len(df)
        
        try:
            for start in range(0, total_rows, batch_size):
                batch_df = df.iloc[start:start + batch_size]
                
                # 转换数据为列表格式
                data_rows = []
                for _, row in batch_df.iterrows():
                    # 处理特殊数据类型
                    row_data = []
                    for value in row:
                        if pd.isna(value):
                            row_data.append(None)
                        elif isinstance(value, bool):
                            row_data.append(1 if value else 0)  # BOOLEAN转BIT
                        else:
                            row_data.append(value)
                    data_rows.append(row_data)
                
                # 批量插入
                cursor.executemany(insert_sql, data_rows)
                self.connection.commit()
                
        except Exception as e:
            self.connection.rollback()
            raise e
    
    def create_table(self, table_name: str, schema: List[Tuple[str, str]]):
        columns = [f"[{col_name}] {col_type}" for col_name, col_type in schema]
        create_sql = f"IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[{table_name}]') AND type in (N'U')) CREATE TABLE [dbo].[{table_name}] ({', '.join(columns)})"
        cursor = self.connection.cursor()
        cursor.execute(create_sql)
        self.connection.commit()
    
    def table_exists(self, table_name: str) -> bool:
        query = """
        SELECT COUNT(*) 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = ? AND TABLE_TYPE = 'BASE TABLE'
        """
        cursor = self.connection.cursor()
        cursor.execute(query, (table_name,))
        return cursor.fetchone()[0] > 0
    
    def truncate_table(self, table_name: str):
        cursor = self.connection.cursor()
        cursor.execute(f"TRUNCATE TABLE {table_name}")
        self.connection.commit()


def create_connector(config: Dict[str, Any]) -> DatabaseConnector:
    """工厂方法：根据配置创建相应的数据库连接器"""
    db_type = config['type'].lower()
    
    if db_type == 'sqlite':
        return SQLiteConnector(config)
    elif db_type == 'sqlserver':
        return SQLServerConnector(config)
    else:
        raise ValueError(f"不支持的数据库类型: {db_type}") 