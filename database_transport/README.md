# 数据库迁移工具

这是一个配置化的数据库迁移工具，支持从SQLite数据库迁移到SQL Server数据库。该工具设计为可重用的，可以轻松集成到其他项目中。

## 功能特性

- 🚀 **配置化迁移**: 通过YAML配置文件定制迁移行为
- 📊 **批量处理**: 支持大数据量的分批迁移，避免内存溢出
- 🔄 **数据类型映射**: 自动映射SQLite和SQL Server之间的数据类型
- ✅ **迁移验证**: 迁移完成后自动验证数据完整性
- 📝 **详细日志**: 完整的迁移过程日志记录
- 🛠️ **命令行工具**: 提供友好的命令行界面
- 🔍 **表结构查看**: 可以查看源数据库的表结构
- 🎯 **选择性迁移**: 支持指定要迁移的表或排除某些表

## 安装依赖

```bash
pip install -r requirements.txt
```

## 快速开始

### 1. 生成配置文件

```bash
python main.py init-config
```

这将生成一个 `config.yaml` 配置文件模板。

### 2. 编辑配置文件

编辑 `config.yaml` 文件，配置你的数据库连接信息：

```yaml
source_database:
  type: "sqlite"
  connection:
    database: "path/to/your/source.db"

target_database:
  type: "sqlserver"
  connection:
    server: "your-server"
    database: "your-database"
    username: "your-username"
    password: "your-password"
    port: 1433
    driver: "ODBC Driver 17 for SQL Server"
```

### 3. 测试连接

```bash
python main.py migrate --dry-run
```

### 4. 执行迁移

```bash
python main.py migrate
```

## 命令说明

### migrate - 执行迁移
```bash
python main.py migrate [OPTIONS]

选项:
  -c, --config TEXT  配置文件路径 [默认: config.yaml]
  --dry-run          干运行模式，只检查配置不执行迁移
```

### validate - 验证迁移结果
```bash
python main.py validate [OPTIONS]

选项:
  -c, --config TEXT  配置文件路径 [默认: config.yaml]
```

### test-sqlserver - 测试SQL Server连接
```bash
python main.py test-sqlserver [OPTIONS]

选项:
  -c, --config TEXT  配置文件路径 [默认: config.yaml]

功能:
  - 检查ODBC驱动安装情况
  - 测试pyodbc和pymssql连接
  - 显示SQL Server版本和用户权限
  - 提供详细的故障排除建议
```

### list-tables - 列出源数据库中的表
```bash
python main.py list-tables [OPTIONS]

选项:
  -c, --config TEXT  配置文件路径 [默认: config.yaml]
```

### show-schema - 显示表结构
```bash
python main.py show-schema [OPTIONS] TABLE_NAME

参数:
  TABLE_NAME  要查看的表名

选项:
  -c, --config TEXT  配置文件路径 [默认: config.yaml]
```

### init-config - 生成配置文件模板
```bash
python main.py init-config [OPTIONS]

选项:
  -o, --output TEXT  输出配置文件路径 [默认: config.yaml]
```

## 配置文件详解

### 数据库连接配置

#### SQLite 源数据库
```yaml
source_database:
  type: "sqlite"
  connection:
    database: "path/to/source.db"  # SQLite数据库文件路径
```

#### SQL Server 目标数据库
```yaml
target_database:
  type: "sqlserver"
  connection:
    server: "localhost"              # 服务器地址
    database: "target_database"      # 数据库名
    username: "sa"                   # 用户名
    password: "your_password"        # 密码
    port: 1433                       # 端口号
    driver: "ODBC Driver 17 for SQL Server"  # ODBC驱动
```

### 迁移设置

```yaml
migration_settings:
  batch_size: 1000                   # 批处理大小
  truncate_target_tables: false     # 是否清空目标表
  create_target_tables: true        # 是否创建目标表
  preserve_schema: true             # 是否保持原始表结构
  continue_on_error: true           # 发生错误时是否继续
  
  # 数据类型映射
  type_mappings:
    TEXT: "NVARCHAR(MAX)"
    INTEGER: "INT"
    REAL: "FLOAT"
    BLOB: "VARBINARY(MAX)"
    DATETIME: "DATETIME2"
```

### 表配置

```yaml
tables:
  # 要迁移的表（空列表表示迁移所有表）
  include_tables: []
  
  # 要排除的表
  exclude_tables: ["temp_table", "log_table"]
  
  # 表名映射（源表名 -> 目标表名）
  table_mappings:
    old_table_name: "new_table_name"
```

### 日志配置

```yaml
logging:
  level: "INFO"                     # 日志级别
  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
  file: "migration.log"             # 日志文件路径
```

## 在其他项目中使用

### 作为模块导入

```python
from data_migrator import DataMigrator

# 创建迁移器
migrator = DataMigrator('config.yaml')

# 执行迁移
success = migrator.migrate()

if success:
    # 验证迁移结果
    validation_result = migrator.validate_migration()
    print(f"迁移验证结果: {validation_result}")
```

### 自定义配置

```python
import yaml
from data_migrator import DataMigrator

# 自定义配置
config = {
    'source_database': {
        'type': 'sqlite',
        'connection': {'database': 'source.db'}
    },
    'target_database': {
        'type': 'sqlserver',
        'connection': {
            'server': 'localhost',
            'database': 'target',
            'username': 'sa',
            'password': 'password'
        }
    },
    # ... 其他配置
}

# 保存配置到文件
with open('custom_config.yaml', 'w', encoding='utf-8') as f:
    yaml.dump(config, f, default_flow_style=False, allow_unicode=True)

# 使用自定义配置
migrator = DataMigrator('custom_config.yaml')
migrator.migrate()
```

## 支持的数据库类型

### 当前支持
- **源数据库**: SQLite
- **目标数据库**: SQL Server

### 扩展支持
可以通过继承 `DatabaseConnector` 基类来添加对其他数据库的支持：

```python
from database_connector import DatabaseConnector

class MySQLConnector(DatabaseConnector):
    def connect(self):
        # 实现MySQL连接逻辑
        pass
    
    # 实现其他抽象方法
    # ...
```

## 注意事项

1. **SQL Server 驱动**: 确保系统已安装适当的ODBC驱动
2. **权限配置**: 确保目标数据库用户有创建表和插入数据的权限
3. **数据类型**: 复杂数据类型可能需要手动调整映射配置
4. **大数据量**: 对于特别大的数据库，建议调整 `batch_size` 参数
5. **网络环境**: 跨网络迁移时要考虑网络稳定性

## 故障排除

### 常见问题

1. **连接失败**
   - 检查数据库服务是否运行
   - 验证连接参数是否正确
   - 确认防火墙设置

2. **ODBC驱动问题**
   - 安装正确版本的SQL Server ODBC驱动
   - 检查驱动名称是否正确

3. **权限问题**
   - 确保数据库用户有足够权限
   - 检查目标数据库是否存在

4. **数据类型错误**
   - 检查类型映射配置
   - 手动调整有问题的数据类型

### 日志分析

查看 `migration.log` 文件获取详细的错误信息和迁移过程。

## 贡献

欢迎提交问题报告和功能请求。如果你想贡献代码，请：

1. Fork 这个项目
2. 创建你的特性分支
3. 提交你的更改
4. 推送到分支
5. 创建一个 Pull Request

## 许可证

MIT License 