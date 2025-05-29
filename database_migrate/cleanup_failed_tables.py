#!/usr/bin/env python3
"""
清理失败的迁移表
删除目标数据库中创建失败或不完整的表
"""

import yaml
import pyodbc
import sys


def cleanup_failed_tables(config_file):
    """清理失败的迁移表"""
    print("清理失败的迁移表...")
    
    try:
        # 加载配置
        with open(config_file, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
        
        target_config = config['target_database']['connection']
        
        # 连接到SQL Server
        connection_string = (
            f"DRIVER={{{target_config.get('driver', 'ODBC Driver 17 for SQL Server')}}};"
            f"SERVER={target_config['server']},{target_config.get('port', 1433)};"
            f"DATABASE={target_config['database']};"
            f"UID={target_config['username']};"
            f"PWD={target_config['password']}"
        )
        
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        # 获取当前存在的表
        cursor.execute("""
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
        """)
        
        existing_tables = [row[0] for row in cursor.fetchall()]
        print(f"找到现有表: {existing_tables}")
        
        # 要清理的表（根据日志中的错误表）
        tables_to_cleanup = ['organizations', 'topics', 'contacts', 'sessions', 'chats', 'messages', 'surveys']
        
        # 删除存在的表
        for table in tables_to_cleanup:
            if table in existing_tables:
                print(f"删除表: {table}")
                cursor.execute(f"DROP TABLE IF EXISTS [{table}]")
                conn.commit()
            else:
                print(f"表 {table} 不存在，跳过")
        
        print("清理完成！")
        conn.close()
        return True
        
    except Exception as e:
        print(f"清理失败: {e}")
        return False


if __name__ == "__main__":
    config_file = sys.argv[1] if len(sys.argv) > 1 else 'config.yaml'
    cleanup_failed_tables(config_file) 