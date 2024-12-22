import{_ as i,c as a,a2 as t,o as n}from"./chunks/framework.DqceH366.js";const p="/assets/image-20240504102023071.CfKtMp6k.png",c=JSON.parse('{"title":"type,object,class 三者关系","description":"","frontmatter":{},"headers":[],"relativePath":"python/supplement/TypeAndObjectAndClass.md","filePath":"python/supplement/TypeAndObjectAndClass.md","lastUpdated":1729167500000}'),h={name:"python/supplement/TypeAndObjectAndClass.md"};function l(k,s,e,d,E,r){return n(),a("div",null,s[0]||(s[0]=[t(`<h1 id="type-object-class-三者关系" tabindex="-1">type,object,class 三者关系 <a class="header-anchor" href="#type-object-class-三者关系" aria-label="Permalink to &quot;type,object,class 三者关系&quot;">​</a></h1><p>在python中，所有类的创建关系遵循：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>type -&gt; int -&gt; 1</span></span>
<span class="line"><span>type -&gt; class -&gt; obj</span></span></code></pre></div><p>例如：</p><div class="language-python vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">python</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">a </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> 1</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">b </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> &quot;abc&quot;</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">print</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">type</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">1</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">))          </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># &lt;class &#39;int&#39;&gt; 返回对象的类型</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">print</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">type</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">int</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">))        </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># &lt;class &#39;type&#39;&gt; 表明这个类是由type生成的</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">print</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">type</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(b))          </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># &lt;class &#39;str&#39;&gt;</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">print</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">type</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">str</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">))        </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># &lt;class &#39;type&#39;&gt;</span></span></code></pre></div><p>在python中，<code>type()</code>方法有两种使用</p><ul><li>返回这个实例变量的类型，如1是整数类型<code>int</code>，&quot;abc&quot;是字符串类型<code>str</code></li><li>返回这个类是由什么类生成的，如<code>int</code>和<code>str</code>都由<code>type</code>类生成</li></ul><p>由此可见，类都是由<code>type</code>这个类所创建的一个个对象</p><p>而<code>type</code>这个类则是由它自身生成的</p><p>再来看<code>object</code>类：</p><div class="language-python vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">python</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">class</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> Student</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    pass</span></span>
<span class="line"></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">stu </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> Student()</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">print</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">type</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(stu))            </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># &lt;class &#39;__main__.Student&#39;&gt;</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">print</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">type</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(Student))        </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># &lt;class &#39;type&#39;&gt;</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">print</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">int</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">.</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">__bases__</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)        </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># (&lt;class &#39;object&#39;&gt;,)</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">print</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">str</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">.</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">__bases__</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)        </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># (&lt;class &#39;object&#39;&gt;,)</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">print</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(Student.</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">__bases__</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)    </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># (&lt;class &#39;object&#39;&gt;,)</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">print</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">type</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">.</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">__bases__</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)       </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># (&lt;class &#39;object&#39;&gt;,)</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">print</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">object</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">.</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">__bases__</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)     </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># ()</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">print</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">type</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">object</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">))         </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># (&lt;class &#39;object&#39;&gt;,)</span></span></code></pre></div><p><code>__bases__</code>方法可以返回一个类的父类</p><p>我们可以看到，<code>object</code>类是所有类的父类（当然也包括<code>type</code>类）</p><p>即使我们不将继承关系直接写在代码块中，python也会默认所有的类继承<code>object</code></p><p>三者关系图</p><p><img src="`+p+'" alt="image-20240504102023071"></p>',16)]))}const g=i(h,[["render",l]]);export{c as __pageData,g as default};
