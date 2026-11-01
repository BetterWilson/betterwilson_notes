---
description: "Project Preparation. Covers: 1 Backup the database from MySQL, 2 Local project package dependencies, 3 Open the cloud server security group."
---

# Local Project Preparation

## 1 Backup the database from MySQL

```bash
mysqldump -uroot -p --default-character-set=utf8 -B <database_to_backup> > <filename>.sql

mysqldump -uroot -p --default-character-set=utf8 -B dahe >dahe_data.sql
```



## 2 Local project package dependencies

```bash
pip freeze > requirements.txt
```




## Online Project Preparation

## 3 Open the cloud server security group

![image-20240215230155324](/images/linux/linux-project-preparation-01.png)
