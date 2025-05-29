#!/usr/bin/env python3
"""
数据库迁移工具主程序
支持从SQLite到SQL Server的数据迁移
"""

import click
import sys
import os
import json
import pyodbc
import pymssql
from pathlib import Path
from data_migrator import DataMigrator
import pdb


@click.group()
@click.version_option(version='1.0.0')
def cli():
    """数据库迁移工具 - 支持从SQLite到SQL Server的数据迁移"""
    pass


@cli.command()
@click.option('--config', '-c', 
              default='config.yaml',
              help='配置文件路径')
@click.option('--dry-run', 
              is_flag=True,
              help='干运行模式，只检查配置不执行迁移')
def migrate(config, dry_run):
    """执行数据库迁移"""
    try:
        click.echo(f"使用配置文件: {config}")
        
        # 检查配置文件是否存在
        if not os.path.exists(config):
            click.echo(f"错误: 配置文件 {config} 不存在", err=True)
            sys.exit(1)
        
        # 创建迁移器
        migrator = DataMigrator(config)
        
        if dry_run:
            click.echo("干运行模式 - 检查配置...")
            # 尝试连接数据库
            if migrator.connect_databases():
                click.echo("✓ 数据库连接测试成功")
                tables = migrator.get_tables_to_migrate()
                click.echo(f"✓ 找到 {len(tables)} 个表需要迁移: {', '.join(tables)}")
                migrator.disconnect_databases()
            else:
                click.echo("✗ 数据库连接测试失败", err=True)
                sys.exit(1)
        else:
            click.echo("开始数据库迁移...")
            success = migrator.migrate()
            
            if success:
                click.echo("✓ 数据库迁移完成")
                
                # 询问是否进行验证
                if click.confirm('是否验证迁移结果?'):
                    validation_result = migrator.validate_migration()
                    if validation_result['success']:
                        click.echo("✓ 迁移验证成功")
                    else:
                        click.echo("✗ 迁移验证失败:", err=True)
                        for error in validation_result['errors']:
                            click.echo(f"  - {error}", err=True)
                        sys.exit(1)
            else:
                click.echo("✗ 数据库迁移失败", err=True)
                sys.exit(1)
    
    except Exception as e:
        click.echo(f"错误: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.option('--config', '-c',
              default='config.yaml',
              help='配置文件路径')
def validate(config):
    """验证迁移结果"""
    try:
        click.echo(f"使用配置文件: {config}")
        
        if not os.path.exists(config):
            click.echo(f"错误: 配置文件 {config} 不存在", err=True)
            sys.exit(1)
        
        migrator = DataMigrator(config)
        click.echo("开始验证迁移结果...")
        
        validation_result = migrator.validate_migration()
        
        if validation_result['success']:
            click.echo("✓ 验证成功")
            
            # 显示详细结果
            for table, info in validation_result['tables'].items():
                status = "✓" if info['match'] else "✗"
                click.echo(f"  {status} {table}: 源={info['source_rows']}行, 目标={info['target_rows']}行")
        else:
            click.echo("✗ 验证失败:", err=True)
            for error in validation_result['errors']:
                click.echo(f"  - {error}", err=True)
            sys.exit(1)
    
    except Exception as e:
        click.echo(f"错误: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.option('--config', '-c',
              default='config.yaml',
              help='配置文件路径')
def test_sqlserver(config):
    """测试SQL Server连接并提供详细诊断信息"""
    try:
        click.echo("SQL Server 连接测试")
        click.echo("=" * 50)
        
        if not os.path.exists(config):
            click.echo(f"错误: 配置文件 {config} 不存在", err=True)
            sys.exit(1)
        
        # 加载配置
        import yaml
        with open(config, 'r', encoding='utf-8') as f:
            config_data = yaml.safe_load(f)
        
        target_config = config_data.get('target_database', {})
        if target_config.get('type', '').lower() != 'sqlserver':
            click.echo("错误: 目标数据库类型不是 sqlserver", err=True)
            sys.exit(1)
        
        conn_config = target_config.get('connection', {})
        
        # 显示连接信息
        click.echo("连接配置:")
        click.echo(f"  服务器: {conn_config.get('server', 'N/A')}")
        click.echo(f"  数据库: {conn_config.get('database', 'N/A')}")
        click.echo(f"  用户名: {conn_config.get('username', 'N/A')}")
        click.echo(f"  端口: {conn_config.get('port', 1433)}")
        click.echo(f"  驱动: {conn_config.get('driver', 'ODBC Driver 17 for SQL Server')}")
        click.echo()
        
        # 1. 检查ODBC驱动
        click.echo("1. 检查可用的ODBC驱动...")
        try:
            drivers = pyodbc.drivers()
            click.echo(f"  可用驱动数量: {len(drivers)}")
            sql_server_drivers = [d for d in drivers if 'SQL Server' in d]
            if sql_server_drivers:
                click.echo("  ✓ 找到SQL Server驱动:")
                for driver in sql_server_drivers:
                    click.echo(f"    - {driver}")
            else:
                click.echo("  ✗ 没有找到SQL Server ODBC驱动")
                click.echo("  建议: 请安装 Microsoft ODBC Driver for SQL Server")
        except Exception as e:
            click.echo(f"  ✗ 检查驱动时出错: {e}")
        
        click.echo()
        
        # 2. 测试pyodbc连接
        click.echo("2. 测试pyodbc连接...")
        pyodbc_success = False
        try:
            connection_string = (
                f"DRIVER={{{conn_config.get('driver', 'ODBC Driver 17 for SQL Server')}}};"
                f"SERVER={conn_config['server']},{conn_config.get('port', 1433)};"
                f"DATABASE={conn_config['database']};"
                f"UID={conn_config['username']};"
                f"PWD={conn_config['password']};"
            )
            
            click.echo(f"  连接字符串: DRIVER={{...}};SERVER={conn_config['server']},...;DATABASE={conn_config['database']};UID={conn_config['username']};PWD=***")
            
            conn = pyodbc.connect(connection_string, timeout=10)
            cursor = conn.cursor()
            cursor.execute("SELECT @@VERSION as version")
            version = cursor.fetchone()[0]
            click.echo("  ✓ pyodbc连接成功")
            click.echo(f"  SQL Server版本: {version.split()[3]} {version.split()[4]}")
            
            # 测试基本权限
            cursor.execute("SELECT USER_NAME() as currentuser")
            current_user = cursor.fetchone()[0]

            
            click.echo(f"  当前用户: {current_user}")
            
            # 检查数据库权限
            cursor.execute("""
                SELECT 
                    dp.permission_name,
                    dp.state_desc
                FROM sys.database_permissions dp
                WHERE dp.grantee_principal_id = USER_ID()
                    AND dp.permission_name IN ('CREATE TABLE', 'INSERT', 'SELECT', 'DELETE')
            """)
            permissions = cursor.fetchall()
            if permissions:
                click.echo("  权限检查:")
                for perm in permissions:
                    click.echo(f"    - {perm[0]}: {perm[1]}")
            
            conn.close()
            pyodbc_success = True
            
        except pyodbc.Error as e:
            click.echo(f"  ✗ pyodbc连接失败: {e}")
            if "Login failed" in str(e):
                click.echo("    建议: 检查用户名和密码")
            elif "server was not found" in str(e):
                click.echo("    建议: 检查服务器地址和端口")
            elif "driver" in str(e).lower():
                click.echo("    建议: 检查ODBC驱动是否正确安装")
        except Exception as e:
            click.echo(f"  ✗ pyodbc连接出错: {e}")
        
        click.echo()
        
        # 3. 测试pymssql连接（备用方案）
        click.echo("3. 测试pymssql连接（备用方案）...")
        pymssql_success = False
        try:
            conn = pymssql.connect(
                server=conn_config['server'],
                user=conn_config['username'],
                password=conn_config['password'],
                database=conn_config['database'],
                port=conn_config.get('port', 1433),
                timeout=10
            )
            cursor = conn.cursor()
            cursor.execute("SELECT @@VERSION")
            version = cursor.fetchone()[0]
            click.echo("  ✓ pymssql连接成功")
            click.echo(f"  SQL Server版本: {version.split()[3]} {version.split()[4]}")
            
            conn.close()
            pymssql_success = True
            
        except pymssql.Error as e:
            click.echo(f"  ✗ pymssql连接失败: {e}")
        except Exception as e:
            click.echo(f"  ✗ pymssql连接出错: {e}")
        
        click.echo()
        
        # 4. 总结和建议
        click.echo("测试总结:")
        if pyodbc_success:
            click.echo("  ✓ 推荐使用pyodbc连接（主要方案）")
        elif pymssql_success:
            click.echo("  ✓ 可以使用pymssql连接（备用方案）")
        else:
            click.echo("  ✗ 所有连接方式都失败")
            click.echo()
            click.echo("故障排除建议:")
            click.echo("  1. 检查SQL Server服务是否运行")
            click.echo("  2. 检查网络连接和防火墙设置")
            click.echo("  3. 确认服务器地址、端口和数据库名是否正确")
            click.echo("  4. 验证用户名和密码")
            click.echo("  5. 确保用户有足够的数据库权限")
            click.echo("  6. 安装正确版本的ODBC驱动:")
            click.echo("     https://docs.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server")
            sys.exit(1)
        
        click.echo("  💡 连接测试完成，可以进行数据迁移")
    
    except Exception as e:
        click.echo(f"错误: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.option('--output', '-o',
              default='config.yaml',
              help='输出配置文件路径')
def init_config(output):
    """生成配置文件模板"""
    try:
        if os.path.exists(output):
            if not click.confirm(f'配置文件 {output} 已存在，是否覆盖?'):
                return
        
        # 复制默认配置
        default_config_path = Path(__file__).parent / 'config.yaml'
        output_path = Path(output)
        
        if default_config_path.exists():
            import shutil
            shutil.copy2(default_config_path, output_path)
        else:
            # 如果默认配置不存在，创建一个基本配置
            config_content = """# 数据库迁移配置文件
source_database:
  type: "sqlite"
  connection:
    database: "path/to/source.db"

target_database:
  type: "sqlserver"
  connection:
    server: "localhost"
    database: "target_database"
    username: "sa"
    password: "your_password"
    port: 1433
    driver: "ODBC Driver 17 for SQL Server"

migration_settings:
  batch_size: 1000
  truncate_target_tables: false
  create_target_tables: true
  preserve_schema: true
  continue_on_error: true
  
  type_mappings:
    TEXT: "NVARCHAR(MAX)"
    INTEGER: "INT"
    REAL: "FLOAT"
    BLOB: "VARBINARY(MAX)"
    DATETIME: "DATETIME2"

tables:
  include_tables: []
  exclude_tables: []
  table_mappings: {}

logging:
  level: "INFO"
  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
  file: "migration.log"
"""
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(config_content)
        
        click.echo(f"配置文件已生成: {output}")
        click.echo("请编辑配置文件中的数据库连接信息")
    
    except Exception as e:
        click.echo(f"错误: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.option('--config', '-c',
              default='config.yaml',
              help='配置文件路径')
def list_tables(config):
    """列出源数据库中的所有表"""
    try:
        click.echo(f"使用配置文件: {config}")
        
        if not os.path.exists(config):
            click.echo(f"错误: 配置文件 {config} 不存在", err=True)
            sys.exit(1)
        
        migrator = DataMigrator(config)
        
        if not migrator.source_connector.connect():
            click.echo("错误: 无法连接源数据库", err=True)
            sys.exit(1)
        
        try:
            tables = migrator.source_connector.get_tables()
            click.echo(f"源数据库中共有 {len(tables)} 个表:")
            for i, table in enumerate(tables, 1):
                click.echo(f"  {i}. {table}")
        finally:
            migrator.source_connector.disconnect()
    
    except Exception as e:
        click.echo(f"错误: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.option('--config', '-c',
              default='config.yaml',
              help='配置文件路径')
@click.argument('table_name')
def show_schema(config, table_name):
    """显示指定表的结构"""
    try:
        click.echo(f"使用配置文件: {config}")
        
        if not os.path.exists(config):
            click.echo(f"错误: 配置文件 {config} 不存在", err=True)
            sys.exit(1)
        
        migrator = DataMigrator(config)
        
        if not migrator.source_connector.connect():
            click.echo("错误: 无法连接源数据库", err=True)
            sys.exit(1)
        
        try:
            schema = migrator.source_connector.get_table_schema(table_name)
            click.echo(f"表 {table_name} 的结构:")
            click.echo("列名\t\t数据类型")
            click.echo("-" * 40)
            for col_name, col_type in schema:
                click.echo(f"{col_name}\t\t{col_type}")
        finally:
            migrator.source_connector.disconnect()
    
    except Exception as e:
        click.echo(f"错误: {e}", err=True)
        sys.exit(1)


if __name__ == '__main__':
    cli() 