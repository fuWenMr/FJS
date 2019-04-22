/**
 * 为since团队提供的工具库，使用原生js实现
 * 如果不使用其它主流前端框架的话
 */

/*对原生对象的一些处理  原则上只处理兼容性*/
//node.matches
if (!Element.prototype.matches) 
{
    Element.prototype.matches = 
        Element.prototype.matchesSelector	|| 
        Element.prototype.mozMatchesSelector||
        Element.prototype.msMatchesSelector	|| 
        Element.prototype.oMatchesSelector	|| 
		Element.prototype.webkitMatchesSelector	||
		//实在没有的话用query实现  不过性能相当感人
        function(s) {
            var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                i = matches.length;
            while (--i >= 0 && matches.item(i) !== this) {}
            return i > -1;            
        };
}

if (!Function.prototype.bind)
{
	Function.prototype.bind = function(oThis){
		if (typeof this!=="function")
		{
			throw new TypeError('bind -what is trying to be bound is not callable');
		}
		var aArgs = Array.prototype.slice.call(arguments,1);
		var fToBind = this;
		var fNOP = function(){};
		var fBound = function(){
			return fToBind.apply(
				(this instanceof fNOP && oThis ? this: oThis),
				(aArgs.concat(Array.prototype.slice.call(arguments)))
			);
		};
		fNOP.prototype = this.prototype;
		fBound.prototype = new fNOP();

		return fBound;
	};
}

//全部封装在一个对象f里，对象只作为方法载体，避免变量干扰 不提供其它任何功能
var f ={
	//仿照jquery
	extend:function(){
		var length = arguments.length;
		for (var i = 0; i < length; i++)
		{ 
			var type = typeof arguments[i];
			if(type === 'object')
			{
				for (var key in arguments[i]) 
				{
					// 使用for in会遍历数组所有的可枚举属性，包括原型。
					if (Object.prototype.hasOwnProperty.call(source, key))
					{ 
						this[key] = arguments[i][key]; 
					} 
				}
			}
			else if(type === 'function')
			{
				this[key] = arguments[i];				
			}
			return this;
		}
	},
};



!function(){

	/** 生成错误提示
	错误:程序员不开心(144010)
	*/
	f.msg =msg;
	function msg(errorCode,errorMsg,errorType,showFun)
	{
		if(typeof errorType == 'function'){showFun = errorType;}
		else{errorType = (errorType||'错误')+':';}

		if(typeof errorMsg == 'function'){showFun = errorMsg;}
		else{errorMsg =errorType+ errorMsg||'网络或服务器异常,请稍后重试';}

		if(errorCode)
		{
			if(typeof errorCode == 'function'){showFun=errorCode;}
			else{errorMsg+='('+errorCode+')';}
		}
		
		if(showFun)
		{
			showFun(errorMsg);
		}
		return errorMsg;
	}

	/*提取get参数 */
	f.getQueryString = getQueryString;
	function getQueryString(paraName) {
		if(!paraName){return;}
		var reg = new RegExp("(^|&)" + paraName + "=([^&]*)(&|$)");
		var r = window.location.search.substr(1).match(reg);
		if (r) {return decodeURI(r[2]);}
		return ;
	}
	



	/* 为事件冒泡提供的方法*/
	//判断一个dom或者他的某一个父辈节点是否符合某个表达式
	f.parents = parents;
	function parents(childElem,parentSelector,isSelf)
	{
		if(!childElem instanceof Element)
		{
			throw new Error('childElem must be instance of Element');
		}
		var flag;
		if(typeof parentSelector == 'string')
		{
			flag = function(elem){
				return elem.matches('parentSelector');
			};
		}
		else if(parentSelector instanceof Element){
			flag = function(elem){
				return elem === parentSelector;
			};
		}
		else
		{
			throw new Error('parentSelector must be a selector string or a Element instance');
		}
	
		var elem;
		if(isSelf===true) { elem = childElem; }
		else { elem = childElem.parentNode; }

		while(elem!=document.body)
		{
			if (flag(elem)) { return true; }
			else { elem = elem.parentNode; }
		}
		return false;
	}
	


	//事件路由  用于处理一个dom内多个子节点绑定不同事件
	//使用 new 创建对象  内部维护一个选择器-事件队
	//虽然无限制添加 但是同一个元素只会执行第一个匹配的选择器
	f.BubbleEventRoute = BubbleEventRoute;
	function BubbleEventRoute(rootElem,type,isBubble)
	{
		this.rootElem = (rootElem?rootElem:notAuto=false,document.body).parentNode;
		this.routes = {};
		this.list = {root:{next:null},length:0,};
		this.list.end = this.list.root;
		this.f = this.f();
		if(type)
		{
			this.rootElem.addEventLitener(type,this.f,isBubble);
		}
	}
	//清除路由
	BubbleEventRoute.prototype.removeAll = function()
	{
		this.routes = {};
	}
	BubbleEventRoute.prototype.clear = function()
	{
		this.rootElem.removeEventLitener(type,this.f,isBubble||false);
	}
	
	//为路由对象添加选择器 - 事件对
	BubbleEventRoute.prototype.setRoute = function(childSelector,eventFunction)
	{
		if (this.routes[childSelector]) 
		{
			this.routes[childSelector].f = eventFunction;
		}
		else
		{
			var end  = this.list.end;
			end.next = {};
			end.next.value = childSelector;
			this.list.end = end.next;
			this.list.length++;


			this.routes[childSelector] = {s:childSelector,f:eventFunction};
		}
	};
	BubbleEventRoute.prototype.removeRoute = function(childSelector){
		if(childSelector)
		{
			
			var node = this.list.root;
			var no = {next:node};
			while(node.next)
			{
				no = no.next;
				node = node.next;
				if(node.value==childSelector)
				{
					no.next = node.next;
					delete this.routes[childSelector];
					break;
				}
			}
		}
	}
	BubbleEventRoute.prototype.f = function(){
		function fun(event)
		{
			var targetElem = event.target;
			var flag;
			//到达指定根节点 停止冒泡
			while(targetElem!=this.rootElem)
			{
				//一重while遍历当前单链表
				var node = this.list.root;
				while(node.next)
				{
					node = node.next;
					let s = node.value;
					if(targetElem.matches(s))
					{
						let res = this.routes[s].f.call(targetElem,event);
						if(res===true)
						{
							continue;
						}
						break;
					}
				}
				targetElem = targetElem.parentNode;
			}
		}
		return fun.bind(this);
	};
	
	f.htmlEncode = htmlEncode;
	function htmlEncode(str) 
	{
		return String(str)
    	.replace(/&/g, '&amp;')
    	.replace(/"/g, '&quot;')
    	.replace(/'/g, '&#39;')
    	.replace(/</g, '&lt;')
    	.replace(/>/g, '&gt;');
	}

	/*
	模板
	*/
	f.tempalte = tempalte;
	function tempalte(template,data)	
	{
    	return data&& typeof data != 'object'?template:
        	new Function('obj',
            	"var p=[];" +
            	"with(obj){p.push('" +
            	template
            	.replace(/[\r\t\n]/g, " ")
            	.split("<%").join("\t") 
            	.replace(/((^|%>)[^\t]*)'/g, "$1\r")
            	.replace(/\t=(.*?)%>/g, "',$1,'")  
            	.split("\t").join("');")  
            	.split("%>").join("p.push('") 
            	.split("\r").join("\\'")
            	+ "');}return p.join('');"
        	)(data);
	}


	/*reg对象存储常用的正则表达式*/
	//凡是变量名加有_的，表示改正则表达式 为整行判断  形如/^X$/（X为可变部分）
	//所有表达式均不支持内部含有空格
	var regs = {
		to_:function(regNmae){
			var str = regs[regNmae].toString();
			return new RegExp('^'+str.slice(1,str.length-1)+'$');
		},
		emailfor:function(em){return new RegExp('\\w+([-+.]\\w+)*@[\''+em+'\']\.\\w+([-.]\\w+)*')},
		emailfor_:function(em){return this.to_(this.emailfor(em))},
		tel:/(13[0-9]|14[0-9]|15[0-9]|166|17[0-9]|18[0-9]|19[8|9])\d{8}/,
		email:/\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/,
		IDCard:/([1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]|[1-9]\d{7}[0-1][1-9][0-3][0-9]\d{3})/,
		qq:/[1-9]\d{4,10}/,
		wx:/[a-zA-Z]([-_a-zA-Z0-9]{5,19})+/,
		CNword:/[\u4e00-\u9fa5]{0,}/,
	};	
	for(i in regs)
	{
		if(regs[i] instanceof RegExp&&!/_$/.test(i))
		{
			Object.defineProperty(regs,i+'_',{get:function(){return this.to_(i)}});
		}
	}
	f.regs = regs;
}();







