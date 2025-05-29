# 快速使用指南

## 快速开始

### 1. 安装依赖
```bash
cd database_transport
pip install -r requirements.txt
```

### 2. 生成配置文件
```bash
python main.py init-config
```

### 3. 修改配置
编辑生成的 `config.yaml` 文件，配置你的数据库连接信息。

### 4. 测试SQL Server连接
```bash
python main.py test-sqlserver
```

### 5. 测试完整配置
```bash
python main.py migrate --dry-run
```

### 6. 执行迁移
```bash
python main.py migrate
```

## 常用命令

```bash
# 查看帮助
python main.py --help

# 测试SQL Server连接（重要！）
python main.py test-sqlserver

# 列出源数据库中的表
python main.py list-tables

# 查看表结构
python main.py show-schema users

# 验证迁移结果
python main.py validate

# 使用指定配置文件
python main.py migrate -c my_config.yaml
```

## SQL Server连接测试

新增的 `test-sqlserver` 命令会进行全面的连接诊断：

```bash
python main.py test-sqlserver
```

这个命令会：
- 📋 显示当前配置的连接信息
- 🔍 检查系统中可用的ODBC驱动
- 🔗 测试pyodbc连接（主要方案）
- 🔗 测试pymssql连接（备用方案）
- 👤 显示当前用户和权限信息
- 📊 显示SQL Server版本信息
- 💡 提供详细的故障排除建议

## 作为模块使用

```python
from data_migrator import DataMigrator

# 创建迁移器
migrator = DataMigrator('config.yaml')

# 执行迁移
success = migrator.migrate()

# 验证结果
if success:
    result = migrator.validate_migration()
    print(f"验证结果: {result['success']}")
```

## 测试

运行测试脚本创建示例数据库：
```bash
python test_migration.py
```

## 配置示例

最小配置：
```yaml
source_database:
  type: "sqlite"
  connection:
    database: "source.db"

target_database:
  type: "sqlserver"
  connection:
    server: "localhost"
    database: "target"
    username: "sa"
    password: "password"
```

## 故障排除

### 使用连接测试工具
首先运行连接测试命令来诊断问题：
```bash
python main.py test-sqlserver
```

### 常见问题

1. **连接失败**: 
   - 运行 `python main.py test-sqlserver` 获取详细诊断
   - 检查数据库服务和连接参数
   
2. **权限错误**: 
   - 确保数据库用户有足够权限
   - 测试命令会显示当前用户的权限信息
   
3. **驱动问题**: 
   - 测试命令会列出所有可用的ODBC驱动
   - 安装正确的ODBC驱动
   
4. **类型错误**: 
   - 调整 `type_mappings` 配置 