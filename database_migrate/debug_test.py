#!/usr/bin/env python3
"""
Debug测试脚本
用于调试和测试数据库迁移工具的各个组件
"""

import logging
import sys
import traceback
from data_migrator import DataMigrator
from database_connector import create_connector


def setup_debug_logging():
    """设置debug级别的日志"""
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('debug.log', encoding='utf-8')
        ]
    )
    return logging.getLogger(__name__)


def test_config_loading(config_path='config.yaml'):
    """测试配置文件加载"""
    logger = logging.getLogger(__name__)
    logger.info("=" * 50)
    logger.info("测试配置文件加载")
    logger.info("=" * 50)
    
    try:
        migrator = DataMigrator(config_path)
        logger.debug(f"配置加载成功: {migrator.config}")
        logger.info("✅ 配置文件加载成功")
        return migrator
    except Exception as e:
        logger.error(f"❌ 配置文件加载失败: {e}")
        logger.debug(traceback.format_exc())
        return None


def test_source_connection(migrator):
    """测试源数据库连接"""
    logger = logging.getLogger(__name__)
    logger.info("=" * 50)
    logger.info("测试源数据库连接")
    logger.info("=" * 50)
    
    try:
        source_config = migrator.config['source_database']
        logger.debug(f"源数据库配置: {source_config}")
        
        connector = migrator.source_connector
        logger.debug(f"连接器类型: {type(connector)}")
        
        success = connector.connect()
        if success:
            logger.info("✅ 源数据库连接成功")
            
            # 测试获取表列表
            logger.debug("获取表列表...")
            tables = connector.get_tables()
            logger.info(f"找到 {len(tables)} 个表: {tables}")
            
            # 测试获取表结构
            if tables:
                table_name = tables[0]
                logger.debug(f"获取表 {table_name} 的结构...")
                schema = connector.get_table_schema(table_name)
                logger.debug(f"表结构: {schema}")
            
            connector.disconnect()
            return True
        else:
            logger.error("❌ 源数据库连接失败")
            return False
            
    except Exception as e:
        logger.error(f"❌ 源数据库连接测试出错: {e}")
        logger.debug(traceback.format_exc())
        return False


def test_target_connection(migrator):
    """测试目标数据库连接"""
    logger = logging.getLogger(__name__)
    logger.info("=" * 50)
    logger.info("测试目标数据库连接")
    logger.info("=" * 50)
    
    try:
        target_config = migrator.config['target_database']
        logger.debug(f"目标数据库配置: {target_config}")
        
        connector = migrator.target_connector
        logger.debug(f"连接器类型: {type(connector)}")
        
        success = connector.connect()
        if success:
            logger.info("✅ 目标数据库连接成功")
            
            # 测试获取表列表
            logger.debug("获取表列表...")
            tables = connector.get_tables()
            logger.info(f"找到 {len(tables)} 个表: {tables}")
            
            connector.disconnect()
            return True
        else:
            logger.error("❌ 目标数据库连接失败")
            return False
            
    except Exception as e:
        logger.error(f"❌ 目标数据库连接测试出错: {e}")
        logger.debug(traceback.format_exc())
        return False


def test_data_type_mapping(migrator):
    """测试数据类型映射"""
    logger = logging.getLogger(__name__)
    logger.info("=" * 50)
    logger.info("测试数据类型映射")
    logger.info("=" * 50)
    
    try:
        test_types = ['TEXT', 'INTEGER', 'REAL', 'BLOB', 'DATETIME', 'VARCHAR']
        
        for source_type in test_types:
            mapped_type = migrator.map_data_type(source_type)
            logger.debug(f"{source_type} -> {mapped_type}")
        
        logger.info("✅ 数据类型映射测试完成")
        return True
        
    except Exception as e:
        logger.error(f"❌ 数据类型映射测试失败: {e}")
        logger.debug(traceback.format_exc())
        return False


def test_migration_dry_run(migrator):
    """测试迁移干运行"""
    logger = logging.getLogger(__name__)
    logger.info("=" * 50)
    logger.info("测试迁移干运行")
    logger.info("=" * 50)
    
    try:
        # 连接数据库
        if not migrator.connect_databases():
            logger.error("❌ 无法连接数据库")
            return False
        
        # 获取要迁移的表
        tables = migrator.get_tables_to_migrate()
        logger.info(f"将迁移 {len(tables)} 个表")
        
        for table in tables:
            logger.debug(f"分析表: {table}")
            
            # 获取源表结构
            source_schema = migrator.source_connector.get_table_schema(table)
            logger.debug(f"源表结构: {source_schema}")
            
            # 映射数据类型
            target_schema = []
            for col_name, col_type in source_schema:
                mapped_type = migrator.map_data_type(col_type)
                target_schema.append((col_name, mapped_type))
            logger.debug(f"目标表结构: {target_schema}")
            
            # 检查数据量
            data = migrator.source_connector.read_table(table)
            logger.info(f"表 {table}: {len(data)} 行数据")
        
        migrator.disconnect_databases()
        logger.info("✅ 迁移干运行测试完成")
        return True
        
    except Exception as e:
        logger.error(f"❌ 迁移干运行测试失败: {e}")
        logger.debug(traceback.format_exc())
        return False


def debug_specific_method(migrator, method_name, *args, **kwargs):
    """调试特定方法"""
    logger = logging.getLogger(__name__)
    logger.info("=" * 50)
    logger.info(f"调试方法: {method_name}")
    logger.info("=" * 50)
    
    try:
        if hasattr(migrator, method_name):
            method = getattr(migrator, method_name)
            logger.debug(f"调用方法: {method_name}({args}, {kwargs})")
            result = method(*args, **kwargs)
            logger.debug(f"方法返回: {result}")
            logger.info(f"✅ 方法 {method_name} 执行成功")
            return result
        else:
            logger.error(f"❌ 方法 {method_name} 不存在")
            return None
            
    except Exception as e:
        logger.error(f"❌ 方法 {method_name} 执行失败: {e}")
        logger.debug(traceback.format_exc())
        return None


def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("使用方法:")
        print("  python debug_test.py config               # 测试配置加载")
        print("  python debug_test.py source               # 测试源数据库连接")
        print("  python debug_test.py target               # 测试目标数据库连接")
        print("  python debug_test.py mapping              # 测试数据类型映射")
        print("  python debug_test.py dry-run              # 测试迁移干运行")
        print("  python debug_test.py all                  # 运行所有测试")
        print("  python debug_test.py method <方法名> [参数] # 调试特定方法")
        print()
        print("示例:")
        print("  python debug_test.py method connect_databases")
        print("  python debug_test.py method get_tables_to_migrate")
        sys.exit(1)
    
    # 设置debug日志
    logger = setup_debug_logging()
    logger.info("开始Debug测试")
    
    test_type = sys.argv[1].lower()
    config_path = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith('method') else 'config.yaml'
    
    # 加载配置
    migrator = test_config_loading(config_path)
    if not migrator:
        sys.exit(1)
    
    try:
        if test_type == 'config':
            logger.info("配置测试完成")
            
        elif test_type == 'source':
            test_source_connection(migrator)
            
        elif test_type == 'target':
            test_target_connection(migrator)
            
        elif test_type == 'mapping':
            test_data_type_mapping(migrator)
            
        elif test_type == 'dry-run':
            test_migration_dry_run(migrator)
            
        elif test_type == 'all':
            logger.info("运行所有测试...")
            test_source_connection(migrator)
            test_target_connection(migrator)
            test_data_type_mapping(migrator)
            test_migration_dry_run(migrator)
            
        elif test_type == 'method':
            if len(sys.argv) < 3:
                logger.error("请指定要调试的方法名")
                sys.exit(1)
            method_name = sys.argv[2]
            args = sys.argv[3:] if len(sys.argv) > 3 else []
            debug_specific_method(migrator, method_name, *args)
            
        else:
            logger.error(f"未知的测试类型: {test_type}")
            sys.exit(1)
            
    except KeyboardInterrupt:
        logger.info("测试被用户中断")
    except Exception as e:
        logger.error(f"测试过程中出现未处理的错误: {e}")
        logger.debug(traceback.format_exc())
        sys.exit(1)
    
    logger.info("Debug测试完成")


if __name__ == '__main__':
    main() 