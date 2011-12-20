/* @ZenDom-Generator
** @arthor Monday.Chen 
** @contact: monday.chen@gmail.com or twitter: @chanmonday
** @blog: http://huisecheng.com
*/
var ZenDom = {};

(function(ZenDom){

    var options = { "jQuery":false , "debug":false };

    var encode =[] , brace = [];

    ZenDom.dom = function(_str , callback){

        var exp = _str;
        var reg;

        //星号(*)
        reg = /\*.*?\*\]/;
        for(var i = 0; reg.exec(exp); i++)
        {
            encode[i] = reg.exec(exp)[0].replace(/\]$/,"");
            exp = exp.replace(encode[i],"encode"+i);
        }

        exp = exp.replace(/\s*/g,"");//去掉空字符

        //括号   
        reg = /\([^\(\)]*?\)/i;
        for(var i = 0; reg.exec(exp); i++)
        {
            brace[i] = reg.exec(exp)[0];
            exp = exp.replace(brace[i],"brace"+i);
        }

        if(options.debug){
            if(/[\(\)]/.exec(exp)){
                console.log("Warning: ZenDom error on '(' or ')'");
            }
            if(/\*/.exec(exp)){
                console.log("Warning: ZenDom error on '*'");
            }
        }

        var result = create(exp);

        if(options.jQuery && typeof jQuery != "undefined"){
            result = jQuery(result);
        }
        
        if(callback) callback(result);

        return result;
    }

    ZenDom.config = function(op){
        if(!op||!(op instanceof Object)) return options;
        var obj = {};
        for(var attrname in options){
            obj[attrname] = op[attrname] ? op[attrname] : options[attrname];
        }
        options = obj;
        return options;
    }

    var create = function(exp){

        if(!exp||exp=="") return;

        var operation = exp.match(/[\+\>]/g);
        if(operation){//有+或者>操作符
            var elem = exp.split(/[\+\>]/g);//切块
            var arr = [create(elem[operation.length])];//临时数组默认存储行尾变量
            for(var i = operation.length-1; i>=0; i--){
                if(operation[i]=="+"){
                    arr.unshift(create(elem[i]));
                }
                else if(operation[i]==">"){
                    var temp = serAttr(elem[i],arr);
                    arr = [temp];
                }
            }
            return arr[0];
        }
        else{//没有操作符+>
            if(exp.match(/brace\d*/)){//括号内容
                return create(brace[exp.replace(/brace/,"")].replace(/[\(\)]/g,""));
            }
            else{
                return serAttr(exp);
            }
        }
    }

    var serAttr = function(exp,child){
        
        var attr = {} , text = "";
        var id,cl=[];

        var reg = /\#[^\>\+\.\#\[\]]*/;//Get ID
        for(;reg.exec(exp);)
        {
            id = reg.exec(exp)[0];
            exp = exp.replace(id,"");
        }

        reg = /\.[^\>\+\.\#\[\]]*/;//Get Class
        for(var i = 0;reg.exec(exp);i++)
        {
            cl[i] = reg.exec(exp)[0];
            exp = exp.replace(cl[i],"");
            cl[i] = cl[i].replace(".","");
        }

        if(id) attr.id = id.replace("#","");
        if(cl[0]) attr.class = cl.join(" ");

        reg = /\[[^\[\]]*?\]/i;//Get other attribute
        var other,val=[];
        for(;reg.exec(exp);){
            other = reg.exec(exp)[0];
            exp = exp.replace(other,"");
            val = other.replace(/[\[\]]/g,'').split(/[\,\:]/g);

            //替换星号内容
            if(val[0]&&val[0].match(/encode\d*/)){
                val[0] = encode[val[0].replace(/encode/,"")].replace(/\*$/,"").replace(/^\*/,"");
            }
            if(val[1]&&val[1].match(/encode\d*/)){
                val[1] = encode[val[1].replace(/encode/,"")].replace(/\*$/,"").replace(/^\*/,"");
            }

            if(val[0]&&val[1]){
                attr[val[0]] = val[1];
            }else if(val[0]){
                text = val[0];
            }
        }

        if(child){
            return createNode(exp,attr,child,text);
        }
        else{
            return createNode(exp,attr,text);
        }
    }

    var doc = document,
    //HTML5标签:
    tags = ["a", "abbr", "acronym", "address", "applet", "area", "article", "aside", "audio", "b", "base", "basefont", "bdo", "big", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "command", "datagrid", "datalist", "datatemplate", "dd", "del", "details", "dialog", "dir", "div", "dfn", "dl", "dt", "em", "embed", "event-source", "fieldset", "figure", "font", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hr", "html", "i", "iframe", "img", "input", "ins", "isindex", "kbd", "label", "legend", "li", "link", "m", "map", "menu", "meta", "meter", "nav", "nest", "noframes", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "pre", "progress", "q", "rule", "s", "samp", "script", "section", "select", "small", "source", "span", "strike", "strong", "style", "sub", "sup", "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "tt", "u", "ul", "var", "video", "xmp"];

    /*
    ** create_dom part by xhowhy
    ** link: http://x1989.com/a/407.html
    */
    for (var i = 0; tags[i]; i++) {
        //闭包是个好东东
        ZenDom['create_' + tags[i]] = function(tag) {
            return function(attrs, childNode, textNode) {
                return createNode(tag, attrs, childNode, textNode)
            }
        } (tags[i]);
    }
    var createNode = function (tagName, attrs, childNode, textNode) {

        if(options.debug){
            var flag = true;
            for(var i in tags){
                if(tags[i]==tagName) {
                    flag = false;
                    break;
                }
            }
            if(flag){
                console.log("Warning: ZenDom error: wrong tag name '" + tagName + "'");
            }
        }

        //创建以tagName命名的节点
        var node = doc.createElement(tagName);

        //处理attrs参数 设置节点属性
        typeof attrs === 'string' ? createTextNode(node, attrs) : createAttributeNode(node, attrs); //创建并设置属性节点
        //处理childNode参数 添加子节点
        if (typeof childNode === 'string') {
            createTextNode(node, childNode);
        } else if (childNode && childNode.nodeName) {
            node.appendChild(childNode)
        } else if (childNode instanceof Array) {
            for (var i = 0; childNode[i]; i++) {
                node.appendChild(childNode[i])
            }
        }

        //处理文本节点
        if (textNode && typeof textNode === 'string') {
            createTextNode(node, textNode);
        }
        return node;
    }
    var createAttributeNode = function(node, attrs) {
        for (var i in attrs) {
            //下面这种方式适用于原生的节点属性
            //node[i] = attrs[i];
            //在IE下setAttribute设置某些原生属性会有兼容性问题
            //node.setAttribute(i, attrs[i]);
            //document.createAttribute在IE下设置原生属性会不带引号
            var a = doc.createAttribute(i);
            a.value = attrs[i];
            node.setAttributeNode(a);
        }
    }
    var createTextNode = function (node, text) {
        node.appendChild(doc.createTextNode(text))
    }
    /*create_dom part end*/
})(ZenDom);