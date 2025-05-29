#!/usr/bin/env python3
"""
PDB调试示例脚本
演示如何在数据库迁移工具中使用PDB调试器
"""

import pdb
from data_migrator import DataMigrator


def debug_example():
    """PDB调试示例"""
    print("开始PDB调试示例")
    
    # 设置断点 - 程序会在这里暂停
    pdb.set_trace()
    
    # 加载配置
    migrator = DataMigrator('config.yaml')
    
    # 另一个断点
    pdb.set_trace()
    
    # 测试连接
    success = migrator.connect_databases()
    
    if success:
        print("数据库连接成功")
        # 再设一个断点来检查变量
        pdb.set_trace()
        
        tables = migrator.get_tables_to_migrate()
        print(f"找到表: {tables}")
        
        migrator.disconnect_databases()
    
    print("调试示例完成")


if __name__ == "__main__":
    debug_example() 