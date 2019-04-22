//这个玩意用于配合javaWeb开发  作用是把页面中的相对引用路径修改为绝对路径    缺点是并不能避免错误访问  以及配置的麻烦  还没有容错性  还有只能处理html中的引用
//请使用绝对路径引用本js
//强烈建议只在开发阶段使用

/*
在页面最下方输入以下代码  部署后不需要修改引用路径
<script data-f="fDev" src="../../fUrlPath.js"></script>
<script data-f="fDev">
	if(changLinkToAbsolute)
	{
		changLinkToAbsolute("/xhwl/try/a/a");//本页面绝路径，最后的文件名不重要
	}
</script>
*/

if(f)
{
	f.changLinkToAbsolute = changLinkToAbsolute;
}
/**
 * @param pathNow 当前html所在的服绝对路径
*/
function changLinkToAbsolute(pathNow)
{
	if(location.href.startsWith('file'))
	{
		return;
	}
	//转为js准备的src队列
	var readyScriptSrcs= [];
	//先找出可可疑的元素
	var links = document.querySelectorAll('link');
	var scripts = document.querySelectorAll('script');
	var imgs = document.querySelectorAll('img');
	
	// 依次筛选出使用相对路径的
	//同时修改为绝对路径
	!function(){
		links.forEach((link,index)=>{
			var href = link.getAttribute('href');
			if (!href) {return;}
			isAbsolute(href) ? link.setAttribute('href',changLink(href)) : false;
		});
	}();
	!function(){
		scripts.forEach((script,index)=>{
			
			var src = script.getAttribute('src');
			if (!src) {console.log('本地',script);return;}
			if (script.dataset.f=='fDev'){console.log('isme',script);return;}
			if (isAbsolute(src))
			{
				script.parentNode.removeChild(script);
				console.log(121212,src,changLink(src));
				readyScriptSrcs.push(changLink(src));
				
			}	
		});
	}();
	!function(){
		imgs.forEach((img,index)=>{
			var src = img.getAttribute('src');
			if (!src) {return;}
			isAbsolute(src) ? img.setAttribute('src',changLink(src)) : false;	
		});
	}();

	/**
 	* @param pathNow 当前元素引用地址的字符串
	*/
	function isAbsolute(path)
	{
		if ( (/^[a-z]*:\//i).test(path)||(/^\//).test(path)  )
		{
			//首先判断是不是跨域url
			//匹配模式为xxx:/
			//判断是不是绝对路径（以/开头）
			return false;
		}
		else
		{
			//我就当是相对路径了
			return true;
		}
	}

	function changLink(taglinkPath)
	{
		
		//先分割走参数部分
		var paramIndex =  taglinkPath.search(/[?]/);
		var pathOfURL;
		if (paramIndex>0)
		{
			pathOfURL = taglinkPath.substring(0, paramIndex);
		}
		else
		{
			paramIndex = taglinkPath.length;
			pathOfURL = taglinkPath;
		}
		
		var backNum = 0;
		if ( (/^\.\//).test(pathOfURL) )
		{
			
			pathOfURL = pathOfURL.substr(1);
		}
		else if ( (/^[a-z]/i).test(pathOfURL) )
		{
			pathOfURL = '/' + pathOfURL;
		}
		else
		{
			
			//判断相对层数
			while ( (/^\.\.\//).test(pathOfURL) )
			{
				backNum++;
				pathOfURL = pathOfURL.substr(3);
				
			}
			pathOfURL = '/' + pathOfURL;
		}
		
		pathOfURL = pathOfURL + taglinkPath.substr(paramIndex);

		//开始拼接
		var abPaths = pathNow.split('/');
	
		abPaths.pop();
	
		var pathIndex = abPaths.length-1;
	
		while(backNum>0)
		{
			abPaths.pop();
			backNum--;
			pathIndex--;
		}
		
		return abPaths.join('/').replace(/\/\/\/*/,'/')  + pathOfURL;
	}

	// var d=document.createDocumentFragment();
	// readyScripts.forEach((script)=>{
	// 	var sDom = document.createElement("script");
	// 	console.log(script.src,12);
	// 	sDom.src = script.src;
	// 	document.body.appendChild(sDom);
	// });



	// document.body.append(d);


	console.log(readyScriptSrcs);
	var loadNum=0;
	function loadSc()
	{
		var sDom = document.createElement("script");
		sDom.setAttribute('src',readyScriptSrcs[loadNum]);
		console.log(loadNum,sDom);
		sDom.onload = ()=>{
			loadNum++;console.log('finfished',loadNum,readyScriptSrcs[loadNum]);
			if(readyScriptSrcs[loadNum])
			{
				loadSc();
			}
		};
		document.body.appendChild(sDom);
		
		// 
	}
	loadSc();
}