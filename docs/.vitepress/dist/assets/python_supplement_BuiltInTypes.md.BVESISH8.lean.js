import{_ as l,c as e,a2 as s,o as t}from"./chunks/framework.DqceH366.js";const r=JSON.parse('{"title":"","description":"","frontmatter":{},"headers":[],"relativePath":"python/supplement/BuiltInTypes.md","filePath":"python/supplement/BuiltInTypes.md","lastUpdated":1729167500000}'),a={name:"python/supplement/BuiltInTypes.md"};function p(o,i,n,d,c,h){return t(),e("div",null,i[0]||(i[0]=[s(`<h2 id="python中的常见内置类型分类" tabindex="-1">python中的常见内置类型分类 <a class="header-anchor" href="#python中的常见内置类型分类" aria-label="Permalink to &quot;python中的常见内置类型分类&quot;">​</a></h2><ul><li><p><code>None</code>类型</p><p>在python的内置类型中，只有唯一一个类型可以设置为<code>None</code>，可以通过<code>id()</code>函数判断（<code>id()</code>可以用来获取变量的内存地址值）</p><div class="language-python vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">python</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">a </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> None</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">b </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> None</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">print</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">id</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(a))	</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 140704868887752</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">print</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">id</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(b))	</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 140704868887752</span></span></code></pre></div></li><li><p>常见数值类型</p><ul><li><code>int</code></li><li><code>float</code></li><li><code>complex</code>(复数类型)</li><li><code>bool</code></li></ul></li><li><p>迭代类型</p></li><li><p>序列类型</p><ul><li><code>list</code></li><li><code>bytes</code>、<code>bytearry</code>、<code>memoryview</code>(二进制序列)</li><li><code>range</code></li><li><code>tuple</code></li><li><code>str</code></li><li><code>array</code></li></ul></li><li><p>映射类型</p><ul><li><code>dict</code></li></ul></li><li><p>集合</p><ul><li><code>set</code></li><li><code>frozenset</code>(不可修改的<code>set</code>)</li></ul></li><li><p>上下文管理类型</p><ul><li><code>with</code>语句</li></ul></li><li><p>其他类型</p><ul><li>模块类型</li><li>class和实例</li><li>函数类型</li><li>方法类型</li><li>代码类型（python代码本身会被python解释器变成对象类型）</li><li><code>object</code>对象</li><li><code>type</code>类型</li><li><code>ellipsis</code>类型</li><li><code>notimplemented</code>类型</li></ul></li></ul>`,2)]))}const y=l(a,[["render",p]]);export{r as __pageData,y as default};
