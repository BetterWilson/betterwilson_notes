const katex = require('katex');
const formula = String.raw`TF(t,d)=\frac{\text{词t在文档d中出现的次数}}{\text{文档d的总词数}}`;
console.log('Formula:', formula);
try {
    const result = katex.renderToString(formula, {throwOnError: true});
    console.log('Success, length:', result.length);
    console.log(result.substring(0, 500));
} catch (e) {
    console.error('Error:', e.message);
}
