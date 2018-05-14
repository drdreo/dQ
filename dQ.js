(function(scope, isForgiving){
	var version = 1.0008;
	var doc = scope.document;
	var q;
	console.log("____---___ Script is called");

	var  = function( selector, context){
		return q.query(selector, context);
	};

	dQ.loadJS = function (path, callback){
		var js = doc.createElement('script');
		js.src = path;
		js.type = 'text/javascript';
		js.onload = function(){
			callback();
			this.onload = this.onreadystatechange = null;
		};

		js.onreadystatechange = function(){
			if(this.readState == 'complete'){
				this.onload();
			}
		}

		doc.getElementsByTagName('head')[0].appendChild(js);
	};


	dQ.ready = function(fun){
		console.log("____---___ Ready called");
		var last = window.onload;
		var isReady= false;

		if(doc.addEventListener){
			doc.addEventListener('DOMContentLoaded',function(){
				isReady = true;
				fun();
			});
		}

		window.onload = function(){
			if(last) last();

			if(!isReady) fun();
		}

	}

	dQ.toArray = function(item){
		var len = item.length;
		var out = [];
		if(len>0){
			for(var i=0; i<len; i++)
			out[i] = item[i];
		}else{
			out[0] = item;
		}

		return out;
	};

	dQ.start = function (){};
	dQ.version = function (){
		return version;
	};

	dQ.ticker = function(){
		return Ticker.getInstance();
	}

	QueryFacade = function(adapter){
		var dom = function(){
			console.log(adapter)
			return adapter.context;
		},
		query = function(selector,context) {
			return QueryFacade(adapter.query(selector,context));
		},
		text = function (value){
			return adapter.text(value);
		},
		addClass = function (value){
			return adapter.addClass(value);
		},
		removeClass = function (value){
			return adapter.removeClass(value);
		},
		addStyle = function (value){
			return adapter.addStyle(value);
		},
		removeStyle = function (value){
			return adapter.removeStyle(value);
		};

		return {dom:dom, query:query, text:text, add: {cl4ss: addClass, style: addStyle}, remove: {cl4ss: removeClass, style: removeStyle}};
	}

	QueryFacade.create = function(adapter, lib, context){
		return QueryFacade(new adapter(lib,context));
	}

	NativeQuery = function(lib,context){
		console.log("Native Constructor context: " ,context);
		this.context = context;
	}

	NativeQuery.prototype.query = function(selector,context) {
		context = context || this.context;
		return new NativeQuery(null, dQ.toArray(context.querySelectorAll(selector)));
	};

	NativeQuery.prototype.text = function (value){
		innerText = (this.context[0].innerText===undefined) ? 'textContent':'innerText';

		for(var item in this.context){
			this.context[item][innerText] = value;
		}

		return value;
	};

	NativeQuery.prototype.addClass = function(value) {
		// old browsers - use className
		if(this.context[0].classList===undefined)
		{
			for(var item in this.context){
				this.context[item].className = this.context[item].className + value;
			}
		}
		else // new browsers - use classList
		{
			for(var item in this.context){
				this.context[item].classList.add(value);
			}
		}

		return value;
	};

	NativeQuery.prototype.removeClass = function(value) {
		// old browsers - use className
		if(this.context[0].classList===undefined)
		{
			for(var item in this.context){
				var regex = new RegExp("\\b"+value+"\\b","g");
				element.className = element.className.replace(regex, "");

				this.context[item].className = this.context[item].className + value;
			}
		}
		else // new browsers - use classList
		{
			for(var item in this.context){
				this.context[item].classList.remove(value);
			}
		}

		return value;
	};

	NativeQuery.prototype.addStyle = function(styles) {
		for(var item in this.context)
		{
			for (var property in styles)
			{
				this.context[item].style[property] = styles[property];
			}
		}

		return styles;
	};

	NativeQuery.prototype.removeStyle = function(styles) {
		console.log("Remove Styles: ", styles);
		for(var item in this.context){
			for (var i = 0; i < styles.length; i++)
			{
				var property = styles[i];
				console.log(property);
				this.context[item].style[property] = ""; // null works ib chrome but not IE, hence "" empty string
			}
		}
		return styles;
	};


	SizzleAdapter = function(lib,context){
		this.lib=lib;
		this.context = context;
	};
	SizzleAdapter.prototype.query = function(selector,context) {
		context = context || doc;
		return new SizzleAdapter(this.lib, dQ.toArray(this.lib(selector,context)));
	};

	SizzleAdapter.prototype.text = NativeQuery.prototype.text;
	SizzleAdapter.prototype.addClass = NativeQuery.prototype.addClass;
	SizzleAdapter.prototype.removeClass = NativeQuery.prototype.removeClass;
	SizzleAdapter.prototype.addStyle = NativeQuery.prototype.addStyle;
	SizzleAdapter.prototype.removeStyle = NativeQuery.prototype.removeStyle;

	JQueryAdapter = function(lib,context){
		console.log("Jquery Constructor context: " ,context);
		this.lib=lib;
		this.context = context;
		this.target = lib(context);
	};
	JQueryAdapter.prototype.query = function(selector,context) {
		context = context || doc;
		return new JQueryAdapter(this.lib, this.lib(selector,context).get());
	};

	JQueryAdapter.prototype.text = function (value){
		return this.target.text(value);
	}

	JQueryAdapter.prototype.addClass = function(value) {
		return this.target.addClass(value);
	};

	JQueryAdapter.prototype.removeClass = function(value) {
		return this.target.removeClass(value);
	};

	JQueryAdapter.prototype.addStyle = function(styles) {
		for (var property in styles)
		{
			this.target.css(property,styles[property]);
		}
		return true;
	};

	JQueryAdapter.prototype.removeStyle = function(styles) {

		for (var i = 0; i < styles.length; i++)
		{
			this.target.css(styles[i],"");
		}
		return true;
	};


	var Ticker = (function(){
		var instance;

		function create(){
			var intervalID,
			currentInterval=0,
			maxInterval = 0,
			index = 0,
			sensitivity = 100,
			methods = {},
			api;

			//public methods
			function add(interval,times,callback,name){

				var realInterval = interval - interval%sensitivity;
				maxInterval = Math.max( realInterval , maxInterval);
				name = name || (++index);
				//TBD if name exists fix issue.

				if(!methods[realInterval]) methods[realInterval] = {};


				methods[realInterval][name] = {times:times,
					callback:callback,
					interval:interval};

					start();
				}

				//private methods
				function start(){
					if(!intervalID)
					intervalID = setInterval(runInterval,sensitivity);
				}

				function runInterval(){
					api.dispachEvent({type:'pretick',target:api});
					currentInterval = currentInterval%maxInterval;
					currentInterval+=sensitivity;

					for(var interval in methods)
					if(currentInterval%interval==0)
					processIntervalGroup(methods[interval]);

					api.dispachEvent({type:'tick',target:api});
				}

				function processIntervalGroup(group){
					var item;
					for(var name in group){
						item = group[name];

						item.callback();

						if(item.times==0){
							delete group[name];
						}else{
							--item.times;
						}

					}
				}
				api = {add:add};
				EventDispatcher(api);

				return api;

			}

			return {getInstance:function(){
				if(!instance)  instance = create();

				return instance;
			}}
		})();


		function EventDispatcher(o){
			var list = {};

			o.addEvent = function(type,listener){
				if(!list[type]){
					list[type] = [];
				}

				if(list[type].indexOf(listener) == -1 ){
					list[type].push(listener);
					return true;
				}

				return false;
			};

			o.removeEvent = function(type, listener){
				var lt = list[type],
				index;

				if(lt){
					index = lt.indexOf(listener);
					if(index>-1){
						lt.splice(index,1);
						return true;
					}
				}

				return false;
			};

			o.dispachEvent = function(e){
				var a = list[e.type];
				if(a){
					if(!e.target) e.target = this;
					for(var index in a){
						a[index].call(e.target,e);
					}

				}
			};

		}


		// var o = {};
		// var f= function(){};
		// EventDispatcher(o);
		// var a = [{test:o.removeEvent('car',f),
		// 				value:false,
		// 				msg:'remove event not working as expected'},
		//
		// 			{test:o.addEvent('car',f),
		// 				value:false,
		// 				msg:'add event not working as expected'}];
		//
		// 	for(var item in a){
		// 		if(a[item].test!=a[item].value)
		// 			console.log('....', a[item].msg);
		// 	}

		/*
		console.log(o.removeEvent('car',f), false);
		console.log(o.addEvent('car',f), true);
		console.log(o.addEvent('car',f), false);
		console.log(o.removeEvent('car',f), true);*/



		dQ.ready(function(){
			if('jQuery' in scope){
				q = QueryFacade.create(JQueryAdapter,scope.jQuery,doc);
				dQ.start();
			}
			else if(doc.querySelectorAll && doc.querySelectorAll('body:first-of-type')){
				console.log("ready doc: ", doc);
				q = QueryFacade.create(NativeQuery,null,doc);
				dQ.start();
			}
			else{
				dQ.loadJS('js/sizzle.min.js', function(){
					q = QueryFacade.create(SizzleAdapter,Sizzle,doc);
					dQ.start();
				});
			}
		});

		if(!scope.dQ){
			scope.dQ = dQ;
		}else{
			if(isForgiving && scope.dQ.version){
				scope.dQ = scope.dQ.version()>version ? scope.dQ : dQ;
			}else{
				throw new Error("The variable window.dQ already exists.");
			}
		}

	}(window,true));
