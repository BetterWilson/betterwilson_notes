# Django-admin component

`admin` is a visual tool provided by `django`: it is used to perform CRUD operations on the tables defined in the ORM.

## 1 Overview

When the Django project starts, it automatically finds all classes registered with admin among all models, then generates a series of URLs and view functions for these classes to implement basic CRUD and other functionality.

```python
# admin.py
admin.site.register(models.Depart)
```

```python
路由:
    /admin/app名称/model名称/
    /admin/app名称/model名称/add/
    /admin/app名称/model名称/ID值/history/
    /admin/app名称/model名称/ID值/change/
    /admin/app名称/model名称/ID值/delete/
```

## 2 Basic usage

- Create table data

  ![image-20240428163610913](assets/image-20240428163610913.png)

- Create a superuser to log in to admin

  ```python
  python manage.py createsuperuser
  
  # 按提示数输入账号，邮箱，密码
  ```

- The created superuser data is stored in the database `user_auth` table

  ![image-20240428162113139](assets/image-20240428162113139.png)

- Login

  Visit the route `http://localhost:8000/admin/`

  ![image-20230205071631627](assets/image-20230205071631627.png)

- Configuration

  Each app has an `admin.py` file, in which we can configure the tables we want to perform CRUD operations on

  ![image-20240428162922005](assets/image-20240428162922005.png)

  Now visit again and we can manage our registered tables
  ![image-20240428163042460](assets/image-20240428163042460.png)

  The three options for adding data

  ![image-20240428163410940](assets/image-20240428163410940.png)

## 3 admin configuration methods

- Method 1: use `admin.site.register`, passing a custom configuration class as a parameter

  ![image-20240428164934307](assets/image-20240428164934307.png)

- Method 2: use the decorator `admin.register` above a custom class to register the table

  ![image-20240428170612983](assets/image-20240428170612983.png)

## 4 Source code analysis

### 4.1 Loading `admin.py`

When we start the Django project, Django first runs the `admin.py` file in every app directory.

The executed code is `autodiscover_modules("admin", register_to=site)`

![image-20240428201346638](assets/image-20240428201346638.png)

![image-20240428201402894](assets/image-20240428201402894.png)

Now if we customize `autodiscover_modules("xxxx")`

every time the Django project runs, it will by default first look for the `xxxx.py` file in each app and execute it.

When `admin.py` is loaded, the `admin.site` method is executed.

![image-20240428183333186](assets/image-20240428183333186.png)

Looking inside `admin.site`, we find that `site` is an instantiated object.

![image-20240428183506456](assets/image-20240428183506456.png)

The object instantiated by `site` is actually an `AdminSite`, and `DefaultAdminSite()` is actually a **lazy loading** mechanism.

![image-20240428183616977](assets/image-20240428183616977.png)

In the initializer of `AdminSite`, an empty dictionary `_registry` is defined.

![image-20240428183856240](assets/image-20240428183856240.png)

### 4.2 Executing the `register` method at registration time

![image-20240428185249667](assets/image-20240428185249667.png)

`self._registry[model] = admin_class(model, self)`

The model class is used as the key of the dictionary, and the model's configuration object is used as the value, stored into the initially empty `_registry` dictionary.

### 4.3 Dynamically generating URLs

In `urls.py`, executing `admin.site.urls` essentially goes into `sites.py` and executes the `get_urls()` method.

It returns a list that contains the URL routing data.

**Note: due to the singleton pattern, the `admin.site` object created here is the same object as the one created in `ModelAdmin`** (this means storing data and retrieving data happen on the same object).

![image-20240428185647207](assets/image-20240428185647207.png)

![image-20240428185820449](assets/image-20240428185820449.png)

What is finally returned is the basic `urlpatterns` plus the automatically generated URLs for each class we registered.

![image-20240428190116538](assets/image-20240428190116538.png)

Here another level of nesting is added, prefixed with the app name and table name, with `model_admin.urls` nested inside.

To see the specific route distribution, you need to look under the `urls` of the specific class.

This makes it convenient to customize routes by overriding the `urls` of a particular class.

![image-20240428190629071](assets/image-20240428190629071.png)

Now let's look at the route distribution in `ModelAdmin`; essentially it returns a list containing the specific CRUD routes.

![image-20240428191357011](assets/image-20240428191357011.png)

![image-20240428191632466](assets/image-20240428191632466.png)



## 4 Common configurations

- `list_display`, when listing, customizes the columns displayed. `@admin.display(description="自定义")` modifies the column title shown on the page.

  ```python
  class DepartAdmin(admin.ModelAdmin):
      list_display = ('id', 'title', 'mine1', 'mine2')
  
      @admin.display(description="自定义列")
      def mine1(self, obj):
          return obj.title + "123"
      
      @admin.display(description="自定义可跳转的列")
      def mine2(self, obj):
          return mark_safe(f"<a href='https://www.google.com'>{obj.title}</a>")
      
  admin.site.register(models.Depart, DepartAdmin)    
  ---------------------------------------------------------------------------------------------------------
  # 或者	mine.short_description = "自定义"	等同于使用装饰器	@admin.display(description="自定义")
  ```

  ![image-20240428165553633](assets/image-20240428165553633.png)

- `list_display_links`, when listing, columns can be clicked to jump.

  ```python
  @admin.register(models.Depart)
  class DepartAdmin(admin.ModelAdmin):
      list_display = ('id', 'title', 'mine')
      list_display_links = ['title']
  
      @admin.display(description="我的自定义")
      def mine(self, obj):
          return obj.title + "123"
  ```

- `list_filter`, when listing, customizes the quick filter on the right side.

  ```python
  from django.utils.translation import ugettext_lazy as _
   
  @admin.register(models.UserInfo)
  class UserAdmin(admin.ModelAdmin):
      list_display = ('user', 'pwd')
   
      class Ugg(admin.SimpleListFilter):
          title = _('decade born')
          parameter_name = 'xxxxxx'
   
          def lookups(self, request, model_admin):
              """
              显示筛选选项
              :param request:
              :param model_admin:
              :return:
              """
              return models.UserGroup.objects.values_list('id', 'title')
   
          def queryset(self, request, queryset):
              """
              点击查询时，进行筛选
              :param request:
              :param queryset:
              :return:
              """
              v = self.value()
              return queryset.filter(ug=v)
   
      list_filter = ('user',Ugg,)
  ```

- `list_select_related`, when listing, whether to automatically use `select_related` for related-table queries.

- Pagination related

  ```python
  # 分页，每页显示条数
      list_per_page = 100
   
  # 分页，显示全部（真实数据<该值时，才会有显示全部）
      list_max_show_all = 200
   
  # 分页插件
      paginator = Paginator
  ```

- `list_editable`, when listing, the columns that can be edited.

  ```python
  @admin.register(models.Depart)
  class DepartAdmin(admin.ModelAdmin):
      list_display = ('id', 'title')
  	list_display_links = ['title']
  ```

  ![image-20240428171149768](assets/image-20240428171149768.png)

- `search_fields`, when listing, the fuzzy search feature.

  ```python
  @admin.register(models.Depart)
  class DepartAdmin(admin.ModelAdmin):
       
      search_fields = ['id', 'title']
  ```

  ![image-20240428172019921](assets/image-20240428172019921.png)

- `date_hierarchy`, when listing, searches `Date` and `DateTime` types.

  ```python
  @admin.register(models.UserInfo)
  class UserAdmin(admin.ModelAdmin):
   
      date_hierarchy = 'ctime'
  ```

- `preserve_filters`, on the detail page, after delete, modify, or update, whether to keep the original search conditions when returning to the list.

- `save_as = False`, on the detail page, the button is "Save as new" or "Save and add another".

- `save_as_continue = True`, click save and continue editing.

  ```python
  save_as_continue = True
   
  # 如果 save_as=True，save_as_continue = True， 点击Sava as new 按钮后继续编辑。
  # 如果 save_as=True，save_as_continue = False，点击Sava as new 按钮后返回列表。
  ```

- `save_on_top = False`, on the detail page, whether to also show save/delete buttons at the top of the page.

- `inlines`, on the detail page, if other tables have an FK to the current table, the detail page can dynamically add and delete rows.

  ```python
  class UserInfoInline(admin.StackedInline): # TabularInline
      extra = 0
      model = models.UserInfo
   
   
  class GroupAdminMode(admin.ModelAdmin):
      list_display = ('id', 'title',)
      inlines = [UserInfoInline, ]
  ```

- `action`, when listing, customizes the operations in the actions dropdown.

  ```python
  @admin.register(models.Depart)
  class DepartAdmin(admin.ModelAdmin):
   
      # 定制Action行为具体方法
      def func(self, request, queryset):
          print(self, request, queryset)
          print(request.POST.getlist('_selected_action'))
   
      func.short_description = "中文显示自定义Actions"
      actions = [func, ]
   
      # Action选项都是在页面上方显示
      actions_on_top = True
      # Action选项都是在页面下方显示
      actions_on_bottom = False
   
      # 是否显示选择个数
      actions_selection_counter = True
  ```

  ![image-20240428171545633](assets/image-20240428171545633.png)

  When we select, the form data is sent via a POST request and can be retrieved from `request.POST`.

- Custom HTML templates

  ```python
  add_form_template = None
  change_form_template = None
  change_list_template = None
  delete_confirmation_template = None
  delete_selected_confirmation_template = None
  object_history_template = None
  ```

- `raw_id_fields`, on the detail page, renders FK and M2M fields as Input boxes.

  ```python
  @admin.register(models.UserInfo)
  class UserAdmin(admin.ModelAdmin):
   
      raw_id_fields = ('FK字段', 'M2M字段',)
  ```

- `fields`, on the detail page, the fields to display.

  ```python
  @admin.register(models.UserInfo)
  class UserAdmin(admin.ModelAdmin):
      fields = ('user',)
  ```

- `exclude`, on the detail page, the fields to exclude.

  ```python
  @admin.register(models.UserInfo)
  class UserAdmin(admin.ModelAdmin):
      exclude = ('user',)
  ```

- `readonly_fields`, on the detail page, the read-only fields.

  ```python
  @admin.register(models.UserInfo)
  class UserAdmin(admin.ModelAdmin):
      readonly_fields = ('user',)
  ```

- `fieldsets`, on the detail page, uses the `fieldsets` tag to split data into groups for display.

  ```python
  @admin.register(models.UserInfo)
  class UserAdmin(admin.ModelAdmin):
      fieldsets = (
          ('基本数据', {
              'fields': ('user', 'pwd', 'ctime',)
          }),
          ('其他', {
              'classes': ('collapse', 'wide', 'extrapretty'),  # 'collapse','wide', 'extrapretty'
              'fields': ('user', 'pwd'),
          }),
      )
  ```

- On the detail page, when M2M fields are displayed, the data-move selection (directions: up/down and left/right).

  ```python
  @admin.register(models.UserInfo)
  class UserAdmin(admin.ModelAdmin):
      filter_vertical = ("m2m字段",) # 或filter_horizontal = ("m2m字段",)
  ```

- `ordering`, when listing, the data ordering rule.

  ```python
  @admin.register(models.UserInfo)
  class UserAdmin(admin.ModelAdmin):
      ordering = ('-id',)
      或
      def get_ordering(self, request):
          return ['-id', ]
  ```

- `view_on_site`, when editing, whether to show "view on site" on the page.

  ```python
  view_on_site = False
  或
  def view_on_site(self, obj):
      return 'https://www.baidu.com'
  ```

- `radio_fields`, on the detail page, uses radio buttons to show options (FK uses a select by default).

  ```python
  radio_fields = {"ug": admin.VERTICAL} # 或admin.HORIZONTAL
  ```

- `show_full_result_count = True`, when listing, the style of the result count shown after fuzzy search.

  ```python
  @admin.register(models.UserInfo)
  class UserAdmin(admin.ModelAdmin):
      # show_full_result_count = True # 1 result (12 total)
      # show_full_result_count = False  # 1 result (Show all)
      search_fields = ('user',)
  ```

- `formfield_overrides = {}`, on the detail page, specifies the display widget.

  ```python
  from django.forms import widgets
  from django.utils.html import format_html
   
  class MyTextarea(widgets.Widget):
      def __init__(self, attrs=None):
          # Use slightly better defaults than HTML's 20x2 box
          default_attrs = {'cols': '40', 'rows': '10'}
          if attrs:
              default_attrs.update(attrs)
          super(MyTextarea, self).__init__(default_attrs)
   
      def render(self, name, value, attrs=None):
          if value is None:
              value = ''
          final_attrs = self.build_attrs(attrs, name=name)
          return format_html('<textarea {}>\r\n{}</textarea>',final_attrs, value)
   
   
   
  @admin.register(models.UserInfo)
  class UserAdmin(admin.ModelAdmin):
   
      formfield_overrides = {
          models.models.CharField: {'widget': MyTextarea},
      }
  ```

- `prepopulated_fields = {}`, on the add page, when a value is entered in one field, it is automatically filled into the specified field.

  ```python
  @admin.register(models.UserInfo)
  class UserAdmin(admin.ModelAdmin):
   
      prepopulated_fields = {"email": ("user","pwd",)}
  ```

  >*DjangoAdmin中使用js实现功能，页面email字段的值会在输入：user、pwd时自动填充*

- `form = ModelForm`, used to customize the fields displayed during form validation for user requests.

  ```python
  from app01 import models
  from django.forms import ModelForm
  from django.forms import fields
   
   
  class DepartForm(ModelForm):
      others = fields.CharField()
   
      class Meta:
          model = models.Depart
          fields = ['id']
   
  @admin.register(models.UserInfo)
  class UserAdmin(admin.ModelAdmin):
      form = DepartForm
  ```

  ![image-20240428172602912](assets/image-20240428172602912.png)

- `empty_value_display = "列数据为空时，显示默认值"`

  ```python
  @admin.register(models.UserInfo)
  class UserAdmin(admin.ModelAdmin):
      empty_value_display = "列数据为空时，默认显示"
   
      list_display = ('user','pwd','up')
   
      def up(self,obj):
          return obj.user
      up.empty_value_display = "指定列数据为空时，默认显示"
  ```

## 5 Custom stark component

Following the admin source code, build your own more convenient component for CRUD operations.

- Documentation

  https://www.cnblogs.com/wupeiqi/tag/crm%E9%A1%B9%E7%9B%AE/

- Video

  Link: https://pan.baidu.com/s/1UJ51lZqzcgcy9tgC_dmqTg Extraction code: pll4
