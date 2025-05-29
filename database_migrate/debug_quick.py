#!/usr/bin/env python3
"""
快速调试脚本模板
用于快速设置断点调试特定功能
"""

import pdb
import sys
from data_migrator import DataMigrator


def quick_debug_connection():
    """快速调试数据库连接"""
    print("快速调试：数据库连接")
    
    # 1. 在这里设置断点开始调试
    pdb.set_trace()
    
    migrator = DataMigrator('config.yaml')
    
    # 2. 检查配置是否正确加载
    # 在PDB中运行: pp migrator.config
    
    # 3. 测试连接
    success = migrator.connect_databases()
    
    # 4. 如果连接失败，在这里调试
    if not success:
        pdb.set_trace()
        # 在PDB中检查错误原因
    
    return success


def quick_debug_tables():
    """快速调试表操作"""
    print("快速调试：表操作")
    
    migrator = DataMigrator('config.yaml')
    
    if migrator.connect_databases():
        # 设置断点检查表列表
        pdb.set_trace()
        
        tables = migrator.get_tables_to_migrate()
        
        for table in tables:
            # 逐个调试每个表
            pdb.set_trace()
            
            schema = migrator.source_connector.get_table_schema(table)
            print(f"表 {table} 结构: {schema}")
        
        migrator.disconnect_databases()


def quick_debug_migration():
    """快速调试迁移过程"""
    print("快速调试：迁移过程")
    
    migrator = DataMigrator('config.yaml')
    
    # 设置断点开始调试迁移
    pdb.set_trace()
    
    # 在PDB中可以逐步调试：
    # migrator.connect_databases()
    # tables = migrator.get_tables_to_migrate()
    # migrator.create_target_table('your_table', 'your_table')
    
    success = migrator.migrate()
    return success


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("使用方法:")
        print("  python debug_quick.py connection  # 调试连接")
        print("  python debug_quick.py tables      # 调试表操作")
        print("  python debug_quick.py migration   # 调试迁移")
        sys.exit(1)
    
    debug_type = sys.argv[1].lower()
    
    if debug_type == 'connection':
        quick_debug_connection()
    elif debug_type == 'tables':
        quick_debug_tables()
    elif debug_type == 'migration':
        quick_debug_migration()
    else:
        print("无效的调试类型")
        sys.exit(1) 