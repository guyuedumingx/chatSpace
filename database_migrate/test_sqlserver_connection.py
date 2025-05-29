#!/usr/bin/env python3
"""
SQL Server连接测试脚本
可以快速测试SQL Server连接而无需完整的配置文件
"""

import sys
import pyodbc
import pymssql


def test_sqlserver_connection(server, database, username, password, port=1433, driver="ODBC Driver 17 for SQL Server"):
    """
    测试SQL Server连接
    
    Args:
        server: 服务器地址
        database: 数据库名
        username: 用户名
        password: 密码
        port: 端口号
        driver: ODBC驱动名称
    """
    print("SQL Server 连接测试")
    print("=" * 50)
    print(f"服务器: {server}")
    print(f"数据库: {database}")
    print(f"用户名: {username}")
    print(f"端口: {port}")
    print(f"驱动: {driver}")
    print()
    
    # 检查可用驱动
    print("1. 检查ODBC驱动...")
    try:
        drivers = pyodbc.drivers()
        print(f"   找到 {len(drivers)} 个驱动")
        sql_server_drivers = [d for d in drivers if 'SQL Server' in d]
        if sql_server_drivers:
            print("   SQL Server驱动:")
            for d in sql_server_drivers:
                print(f"     - {d}")
        else:
            print("   ⚠️  没有找到SQL Server驱动")
    except Exception as e:
        print(f"   ❌ 检查驱动出错: {e}")
    
    print()
    
    # 测试pyodbc连接
    print("2. 测试pyodbc连接...")
    pyodbc_success = False
    try:
        connection_string = (
            f"DRIVER={{{driver}}};"
            f"SERVER={server},{port};"
            f"DATABASE={database};"
            f"UID={username};"
            f"PWD={password}"
        )
        
        conn = pyodbc.connect(connection_string, timeout=10)
        cursor = conn.cursor()
        
        # 获取版本信息
        cursor.execute("SELECT @@VERSION")
        version = cursor.fetchone()[0]
        print(f"   ✅ 连接成功")
        print(f"   版本: {version.split()[3]} {version.split()[4]}")
        
        # 获取当前用户
        cursor.execute("SELECT USER_NAME()")
        current_user = cursor.fetchone()[0]
        print(f"   用户: {current_user}")
        
        conn.close()
        pyodbc_success = True
        
    except Exception as e:
        print(f"   ❌ 连接失败: {e}")
    
    print()
    
    # 测试pymssql连接
    print("3. 测试pymssql连接...")
    pymssql_success = False
    try:
        conn = pymssql.connect(
            server=server,
            user=username,
            password=password,
            database=database,
            port=port,
            timeout=10
        )
        cursor = conn.cursor()
        
        cursor.execute("SELECT @@VERSION")
        version = cursor.fetchone()[0]
        print(f"   ✅ 连接成功")
        print(f"   版本: {version.split()[3]} {version.split()[4]}")
        
        conn.close()
        pymssql_success = True
        
    except Exception as e:
        print(f"   ❌ 连接失败: {e}")
    
    print()
    
    # 总结
    print("测试结果:")
    if pyodbc_success:
        print("   ✅ pyodbc连接正常（推荐）")
    if pymssql_success:
        print("   ✅ pymssql连接正常（备用）")
    
    if not pyodbc_success and not pymssql_success:
        print("   ❌ 所有连接方式都失败")
        print()
        print("可能的解决方案:")
        print("   1. 检查SQL Server服务是否运行")
        print("   2. 确认服务器地址和端口")
        print("   3. 验证用户名和密码")
        print("   4. 检查防火墙设置")
        print("   5. 安装ODBC驱动: https://docs.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server")
        return False
    
    print("   🎉 连接测试通过，可以进行数据迁移！")
    return True


def main():
    """交互式测试"""
    print("SQL Server 连接测试工具")
    print("=" * 30)
    
    try:
        # 获取连接信息
        server = input("服务器地址 [localhost]: ").strip() or "localhost"
        database = input("数据库名: ").strip()
        username = input("用户名 [sa]: ").strip() or "sa"
        password = input("密码: ").strip()
        port = input("端口 [1433]: ").strip() or "1433"
        
        if not database:
            print("数据库名不能为空")
            sys.exit(1)
        
        if not password:
            print("密码不能为空")
            sys.exit(1)
        
        try:
            port = int(port)
        except ValueError:
            print("端口必须是数字")
            sys.exit(1)
        
        print()
        
        # 执行测试
        success = test_sqlserver_connection(server, database, username, password, port)
        
        if not success:
            sys.exit(1)
    
    except KeyboardInterrupt:
        print("\n测试被取消")
        sys.exit(1)
    except Exception as e:
        print(f"测试过程中出错: {e}")
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        # 命令行参数模式
        if len(sys.argv) != 6:
            print("用法: python test_sqlserver_connection.py <server> <database> <username> <password> <port>")
            print("示例: python test_sqlserver_connection.py localhost MyDB sa MyPassword123 1433")
            sys.exit(1)
        
        server, database, username, password, port = sys.argv[1:6]
        test_sqlserver_connection(server, database, username, password, int(port))
    else:
        # 交互式模式
        main() 