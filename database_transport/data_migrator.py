"""
数据迁移核心模块
实现数据库之间的数据迁移逻辑
"""

import logging
import yaml
from typing import Dict, Any, List, Optional
from tqdm import tqdm
import pandas as pd
from database_connector import create_connector, DatabaseConnector


class DataMigrator:
    """数据迁移器"""
    
    def __init__(self, config_path: str):
        """
        初始化数据迁移器
        
        Args:
            config_path: 配置文件路径
        """
        self.config = self._load_config(config_path)
        self.logger = self._setup_logging()
        
        # 创建源数据库和目标数据库连接器
        self.source_connector = create_connector(self.config['source_database'])
        self.target_connector = create_connector(self.config['target_database'])
        
        # 迁移设置
        self.migration_settings = self.config.get('migration_settings', {})
        self.batch_size = self.migration_settings.get('batch_size', 1000)
        self.type_mappings = self.migration_settings.get('type_mappings', {})
        
        # 表配置
        self.table_config = self.config.get('tables', {})
        self.include_tables = self.table_config.get('include_tables', [])
        self.exclude_tables = self.table_config.get('exclude_tables', [])
        self.table_mappings = self.table_config.get('table_mappings', {})
    
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """加载配置文件"""
        try:
            with open(config_path, 'r', encoding='utf-8') as file:
                config = yaml.safe_load(file)
            return config
        except Exception as e:
            raise Exception(f"无法加载配置文件 {config_path}: {e}")
    
    def _setup_logging(self) -> logging.Logger:
        """设置日志"""
        log_config = self.config.get('logging', {})
        log_level = getattr(logging, log_config.get('level', 'INFO').upper())
        log_format = log_config.get('format', '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        log_file = log_config.get('file', 'migration.log')
        
        # 配置日志
        logging.basicConfig(
            level=log_level,
            format=log_format,
            handlers=[
                logging.FileHandler(log_file, encoding='utf-8'),
                logging.StreamHandler()
            ]
        )
        
        return logging.getLogger(__name__)
    
    def connect_databases(self) -> bool:
        """连接源数据库和目标数据库"""
        self.logger.info("正在连接数据库...")
        
        # 连接源数据库
        if not self.source_connector.connect():
            self.logger.error("无法连接源数据库")
            return False
        
        # 连接目标数据库
        if not self.target_connector.connect():
            self.logger.error("无法连接目标数据库")
            self.source_connector.disconnect()
            return False
        
        self.logger.info("数据库连接成功")
        return True
    
    def disconnect_databases(self):
        """断开数据库连接"""
        self.source_connector.disconnect()
        self.target_connector.disconnect()
        self.logger.info("已断开所有数据库连接")
    
    def get_tables_to_migrate(self) -> List[str]:
        """获取需要迁移的表列表"""
        all_tables = self.source_connector.get_tables()
        
        # 如果指定了包含的表，则只迁移这些表
        if self.include_tables:
            tables_to_migrate = [table for table in all_tables if table in self.include_tables]
        else:
            tables_to_migrate = all_tables
        
        # 排除指定的表
        if self.exclude_tables:
            tables_to_migrate = [table for table in tables_to_migrate if table not in self.exclude_tables]
        
        self.logger.info(f"将迁移以下表: {tables_to_migrate}")
        return tables_to_migrate
    
    def map_data_type(self, source_type: str) -> str:
        """映射数据类型"""
        source_type_upper = source_type.upper()
        return self.type_mappings.get(source_type_upper, source_type)
    
    def create_target_table(self, source_table: str, target_table: str):
        """在目标数据库中创建表"""
        if not self.migration_settings.get('create_target_tables', True):
            return
        
        # 获取源表结构
        source_schema = self.source_connector.get_table_schema(source_table)
        
        # 映射数据类型
        target_schema = []
        for col_name, col_type in source_schema:
            mapped_type = self.map_data_type(col_type)
            target_schema.append((col_name, mapped_type))
        
        # 在目标数据库中创建表
        if not self.target_connector.table_exists(target_table):
            self.target_connector.create_table(target_table, target_schema)
            self.logger.info(f"在目标数据库中创建表: {target_table}")
        else:
            self.logger.info(f"目标表已存在: {target_table}")
    
    def migrate_table_data(self, source_table: str, target_table: str):
        """迁移单个表的数据"""
        self.logger.info(f"开始迁移表数据: {source_table} -> {target_table}")
        
        try:
            # 清空目标表（如果配置了）
            if self.migration_settings.get('truncate_target_tables', False):
                if self.target_connector.table_exists(target_table):
                    self.target_connector.truncate_table(target_table)
                    self.logger.info(f"已清空目标表: {target_table}")
            
            # 获取源表的总行数（用于进度条）
            total_rows_df = self.source_connector.read_table(source_table)
            total_rows = len(total_rows_df)
            
            if total_rows == 0:
                self.logger.info(f"表 {source_table} 没有数据")
                return
            
            # 分批迁移数据
            migrated_rows = 0
            with tqdm(total=total_rows, desc=f"迁移 {source_table}", unit="行") as pbar:
                while migrated_rows < total_rows:
                    # 读取一批数据
                    batch_df = self.source_connector.read_table(
                        source_table, 
                        batch_size=self.batch_size, 
                        offset=migrated_rows
                    )
                    
                    if batch_df.empty:
                        break
                    
                    # 写入目标数据库
                    self.target_connector.write_table(batch_df, target_table, if_exists='append')
                    
                    migrated_rows += len(batch_df)
                    pbar.update(len(batch_df))
            
            self.logger.info(f"表 {source_table} 迁移完成，共迁移 {migrated_rows} 行数据")
            
        except Exception as e:
            self.logger.error(f"迁移表 {source_table} 时发生错误: {e}")
            raise
    
    def migrate(self) -> bool:
        """执行完整的数据迁移"""
        try:
            self.logger.info("开始数据库迁移任务")
            
            # 连接数据库
            if not self.connect_databases():
                return False
            
            # 获取要迁移的表列表
            tables_to_migrate = self.get_tables_to_migrate()
            
            if not tables_to_migrate:
                self.logger.warning("没有找到需要迁移的表")
                return True
            
            # 迁移每个表
            for source_table in tqdm(tables_to_migrate, desc="迁移表", unit="表"):
                # 获取目标表名
                target_table = self.table_mappings.get(source_table, source_table)
                
                try:
                    # 创建目标表
                    self.create_target_table(source_table, target_table)
                    
                    # 迁移数据
                    self.migrate_table_data(source_table, target_table)
                    
                except Exception as e:
                    self.logger.error(f"迁移表 {source_table} 失败: {e}")
                    # 根据配置决定是否继续迁移其他表
                    if not self.migration_settings.get('continue_on_error', True):
                        raise
            
            self.logger.info("数据库迁移任务完成")
            return True
            
        except Exception as e:
            self.logger.error(f"数据库迁移失败: {e}")
            return False
        
        finally:
            # 确保断开数据库连接
            self.disconnect_databases()
    
    def validate_migration(self) -> Dict[str, Any]:
        """验证迁移结果"""
        self.logger.info("开始验证迁移结果")
        validation_result = {
            'success': True,
            'tables': {},
            'errors': []
        }
        
        try:
            # 重新连接数据库
            if not self.connect_databases():
                validation_result['success'] = False
                validation_result['errors'].append("无法连接数据库进行验证")
                return validation_result
            
            # 获取迁移的表列表
            tables_to_validate = self.get_tables_to_migrate()
            
            for source_table in tables_to_validate:
                target_table = self.table_mappings.get(source_table, source_table)
                
                try:
                    # 检查目标表是否存在
                    if not self.target_connector.table_exists(target_table):
                        validation_result['tables'][source_table] = {
                            'exists': False,
                            'source_rows': 0,
                            'target_rows': 0,
                            'match': False
                        }
                        validation_result['errors'].append(f"目标表 {target_table} 不存在")
                        continue
                    
                    # 比较行数
                    source_df = self.source_connector.read_table(source_table)
                    target_df = self.target_connector.read_table(target_table)
                    
                    source_rows = len(source_df)
                    target_rows = len(target_df)
                    rows_match = source_rows == target_rows
                    
                    validation_result['tables'][source_table] = {
                        'exists': True,
                        'source_rows': source_rows,
                        'target_rows': target_rows,
                        'match': rows_match
                    }
                    
                    if not rows_match:
                        validation_result['success'] = False
                        validation_result['errors'].append(
                            f"表 {source_table} 行数不匹配: 源={source_rows}, 目标={target_rows}"
                        )
                    
                    self.logger.info(f"表 {source_table} 验证完成: 源={source_rows}行, 目标={target_rows}行")
                    
                except Exception as e:
                    validation_result['success'] = False
                    validation_result['errors'].append(f"验证表 {source_table} 时出错: {e}")
            
        except Exception as e:
            validation_result['success'] = False
            validation_result['errors'].append(f"验证过程出错: {e}")
        
        finally:
            self.disconnect_databases()
        
        self.logger.info(f"迁移验证完成，结果: {'成功' if validation_result['success'] else '失败'}")
        return validation_result 