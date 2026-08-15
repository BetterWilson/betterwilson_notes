# Local Project Preparation

## 1 Backup the database from MySQL

```bash
mysqldump -uroot -p --default-character-set=utf8 -B 要备份的数据库 >要保存的数据文件名.sql

mysqldump -uroot -p --default-character-set=utf8 -B dahe >dahe_data.sql
```



## 2 Local project package dependencies

```bash
pip freeze > requirements.txt
```




# Online Project Preparation

## 3 Open the cloud server security group

![image-20240215230155324](assets\image-20240215230155324.png)
