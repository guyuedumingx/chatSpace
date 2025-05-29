#!/usr/bin/env python3
"""
测试脚本：创建示例SQLite数据库并测试迁移功能
"""

import sqlite3
import os
import sys
from datetime import datetime
from data_migrator import DataMigrator


def create_sample_sqlite_db(db_path: str = "test_source.db"):
    """创建示例SQLite数据库用于测试"""
    print(f"创建示例SQLite数据库: {db_path}")
    
    # 删除已存在的数据库文件
    if os.path.exists(db_path):
        os.remove(db_path)
    
    # 连接到SQLite数据库
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 创建用户表
        cursor.execute("""
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                email TEXT UNIQUE,
                age INTEGER,
                salary REAL,
                is_active INTEGER,
                created_at DATETIME,
                profile_data BLOB
            )
        """)
        
        # 创建产品表
        cursor.execute("""
            CREATE TABLE products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL,
                stock_quantity INTEGER,
                created_at DATETIME
            )
        """)
        
        # 创建订单表
        cursor.execute("""
            CREATE TABLE orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                product_id INTEGER,
                quantity INTEGER,
                total_amount REAL,
                order_date DATETIME,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (product_id) REFERENCES products (id)
            )
        """)
        
        # 插入示例数据
        users_data = [
            (1, 'alice', 'alice@example.com', 25, 50000.0, 1, datetime.now(), b'profile_data_1'),
            (2, 'bob', 'bob@example.com', 30, 60000.0, 1, datetime.now(), b'profile_data_2'),
            (3, 'charlie', 'charlie@example.com', 35, 70000.0, 0, datetime.now(), b'profile_data_3'),
            (4, 'diana', 'diana@example.com', 28, 55000.0, 1, datetime.now(), b'profile_data_4'),
            (5, 'eve', 'eve@example.com', 32, 65000.0, 1, datetime.now(), b'profile_data_5')
        ]
        
        cursor.executemany("""
            INSERT INTO users (id, username, email, age, salary, is_active, created_at, profile_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, users_data)
        
        products_data = [
            (1, 'Laptop', 'High-performance laptop', 999.99, 50, datetime.now()),
            (2, 'Mouse', 'Wireless mouse', 29.99, 200, datetime.now()),
            (3, 'Keyboard', 'Mechanical keyboard', 79.99, 100, datetime.now()),
            (4, 'Monitor', '27-inch 4K monitor', 299.99, 30, datetime.now()),
            (5, 'Webcam', 'HD webcam', 59.99, 75, datetime.now())
        ]
        
        cursor.executemany("""
            INSERT INTO products (id, name, description, price, stock_quantity, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, products_data)
        
        orders_data = [
            (1, 1, 1, 1, 999.99, datetime.now()),
            (2, 2, 2, 2, 59.98, datetime.now()),
            (3, 3, 3, 1, 79.99, datetime.now()),
            (4, 1, 4, 1, 299.99, datetime.now()),
            (5, 2, 5, 1, 59.99, datetime.now())
        ]
        
        cursor.executemany("""
            INSERT INTO orders (id, user_id, product_id, quantity, total_amount, order_date)
            VALUES (?, ?, ?, ?, ?, ?)
        """, orders_data)
        
        # 提交事务
        conn.commit()
        
        print(f"✓ 示例数据库创建成功，包含:")
        print(f"  - 用户表: {len(users_data)} 条记录")
        print(f"  - 产品表: {len(products_data)} 条记录")
        print(f"  - 订单表: {len(orders_data)} 条记录")
        
    except Exception as e:
        print(f"创建示例数据库时出错: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


def create_test_config(config_path: str = "test_config.yaml"):
    """创建测试配置文件"""
    config_content = """# 测试配置文件
source_database:
  type: "sqlite"
  connection:
    database: "test_source.db"

target_database:
  type: "sqlserver"
  connection:
    server: "localhost"
    database: "TestMigration"
    username: "sa"
    password: "TestPassword123"
    port: 1433
    driver: "ODBC Driver 17 for SQL Server"

migration_settings:
  batch_size: 10  # 小批量用于测试
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
  level: "DEBUG"
  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
  file: "test_migration.log"
"""
    
    with open(config_path, 'w', encoding='utf-8') as f:
        f.write(config_content)
    
    print(f"✓ 测试配置文件已创建: {config_path}")


def test_migration(config_path: str = "test_config.yaml"):
    """测试迁移功能"""
    print("\n开始测试迁移功能...")
    
    try:
        # 创建迁移器
        migrator = DataMigrator(config_path)
        
        print("1. 测试数据库连接...")
        if not migrator.connect_databases():
            print("✗ 数据库连接失败")
            return False
        
        print("✓ 数据库连接成功")
        
        # 获取表列表
        tables = migrator.get_tables_to_migrate()
        print(f"✓ 找到 {len(tables)} 个表: {tables}")
        
        # 断开连接
        migrator.disconnect_databases()
        
        print("\n2. 执行迁移...")
        success = migrator.migrate()
        
        if success:
            print("✓ 迁移完成")
            
            print("\n3. 验证迁移结果...")
            validation_result = migrator.validate_migration()
            
            if validation_result['success']:
                print("✓ 验证成功")
                for table, info in validation_result['tables'].items():
                    print(f"  ✓ {table}: 源={info['source_rows']}行, 目标={info['target_rows']}行")
                return True
            else:
                print("✗ 验证失败:")
                for error in validation_result['errors']:
                    print(f"  - {error}")
                return False
        else:
            print("✗ 迁移失败")
            return False
    
    except Exception as e:
        print(f"测试过程中出错: {e}")
        return False


def main():
    """主函数"""
    print("数据库迁移工具测试")
    print("=" * 50)
    
    try:
        # 创建示例数据库
        create_sample_sqlite_db()
        
        # 创建测试配置
        create_test_config()
        
        print("\n注意: 请确保SQL Server已经运行，并修改test_config.yaml中的连接信息")
        
        # 询问是否执行测试
        if len(sys.argv) > 1 and sys.argv[1] == '--run-test':
            # 执行测试
            test_migration()
        else:
            print("\n要执行完整测试，请运行:")
            print("python test_migration.py --run-test")
            print("\n或者手动执行:")
            print("1. 修改 test_config.yaml 中的SQL Server连接信息")
            print("2. python main.py migrate -c test_config.yaml --dry-run")
            print("3. python main.py migrate -c test_config.yaml")
    
    except Exception as e:
        print(f"错误: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main() 