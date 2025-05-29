#!/usr/bin/env python3
"""
PDB调试器使用教程
逐步演示如何调试数据库迁移工具
"""

import pdb
import sys
from data_migrator import DataMigrator


def tutorial_step_1():
    """教程步骤1：基本PDB使用"""
    print("=== PDB教程步骤1：基本使用 ===")
    
    # 设置断点
    pdb.set_trace()
    
    # 创建一些变量供调试
    config_file = 'config.yaml'
    debug_mode = True
    numbers = [1, 2, 3, 4, 5]
    
    print(f"配置文件: {config_file}")
    print(f"调试模式: {debug_mode}")
    print(f"数字列表: {numbers}")
    
    # 在PDB中尝试这些命令：
    # p config_file          # 打印变量
    # pp numbers            # 美化打印列表
    # type(debug_mode)      # 查看类型
    # n                     # 下一行
    
    result = sum(numbers)
    print(f"求和结果: {result}")


def tutorial_step_2():
    """教程步骤2：调试函数调用"""
    print("\n=== PDB教程步骤2：调试函数调用 ===")
    
    def helper_function(x, y):
        """辅助函数"""
        pdb.set_trace()  # 函数内断点
        result = x * y
        return result
    
    # 主程序断点
    pdb.set_trace()
    
    a = 10
    b = 20
    
    # 在PDB中尝试这些命令：
    # s                     # 进入函数
    # n                     # 不进入函数
    # w                     # 查看调用栈
    
    product = helper_function(a, b)
    print(f"乘积: {product}")


def tutorial_step_3():
    """教程步骤3：调试数据库连接"""
    print("\n=== PDB教程步骤3：调试数据库连接 ===")
    
    try:
        # 设置断点检查配置加载
        pdb.set_trace()
        
        # 在这里你可以：
        # l                         # 查看代码
        # n                         # 下一行
        # s                         # 进入DataMigrator初始化
        
        migrator = DataMigrator('config.yaml')
        
        # 另一个断点检查migrator对象
        pdb.set_trace()
        
        # 在PDB中尝试：
        # pp migrator.config        # 查看配置
        # dir(migrator)            # 查看可用方法
        # type(migrator.source_connector)  # 查看连接器类型
        
        print("配置加载成功")
        
        # 测试连接
        pdb.set_trace()
        success = migrator.connect_databases()
        
        if success:
            print("数据库连接成功")
            
            # 检查连接状态
            pdb.set_trace()
            
            # 在PDB中尝试：
            # migrator.source_connector.connection    # 查看连接对象
            # migrator.get_tables_to_migrate()       # 调用方法
            
            tables = migrator.get_tables_to_migrate()
            print(f"找到表: {tables}")
            
            migrator.disconnect_databases()
        else:
            print("数据库连接失败")
            
    except Exception as e:
        # 异常时的调试
        pdb.set_trace()
        
        # 在PDB中查看异常：
        # p e                      # 查看异常对象
        # import traceback; traceback.print_exc()  # 打印完整错误
        
        print(f"发生错误: {e}")


def tutorial_step_4():
    """教程步骤4：条件断点和高级技巧"""
    print("\n=== PDB教程步骤4：高级技巧 ===")
    
    data = [
        {'name': 'table1', 'rows': 100},
        {'name': 'table2', 'rows': 200},
        {'name': 'table3', 'rows': 50},
    ]
    
    for i, table_info in enumerate(data):
        # 条件断点示例
        if table_info['rows'] > 150:
            pdb.set_trace()
            
        # 在PDB中尝试：
        # p i                      # 当前索引
        # pp table_info           # 当前表信息
        # c                       # 继续到下一个断点
        
        print(f"处理表 {table_info['name']}: {table_info['rows']} 行")


def run_tutorial():
    """运行完整教程"""
    print("PDB调试器使用教程")
    print("=" * 50)
    
    if len(sys.argv) > 1:
        step = sys.argv[1]
        if step == '1':
            tutorial_step_1()
        elif step == '2':
            tutorial_step_2()
        elif step == '3':
            tutorial_step_3()
        elif step == '4':
            tutorial_step_4()
        else:
            print("无效的步骤号，请使用 1-4")
    else:
        print("使用方法:")
        print("  python pdb_tutorial.py 1    # 基本PDB使用")
        print("  python pdb_tutorial.py 2    # 调试函数调用")
        print("  python pdb_tutorial.py 3    # 调试数据库连接")
        print("  python pdb_tutorial.py 4    # 高级技巧")
        print()
        print("或者使用PDB调试器运行:")
        print("  python -m pdb pdb_tutorial.py 1")


if __name__ == "__main__":
    run_tutorial() 