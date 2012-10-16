(function(){
	var $=this.$;
	function parseBind(bind){
		
	}
	var eventSplitter=/\s+/;
	var bindSplitter=/\s*;\s*/;
	/**
	 * @return ViewModel
	 */
	ViewModel.create=function(obj){
		var newObj={};
		$.extend(newObj,ViewModel.prototype,obj);
		return newObj._construct();
	}
	function ViewModel() {
		//для подсказок
		if(false)
		{
			Events.call(this);
			this._binds={};
			this.events={};
			this._cid='';
			this.$el=$();
			this.el=document.createElement('div');
		}
		this._construct();
	}
	ViewModel.prototype=new Events();
	ViewModel.prototype.addBind=function(attr,bind){
		var binds;
		binds=this._binds||(this._binds={});
		return this;
	}
	ViewModel.prototype.setElement=function(el){
		this.el=el;
		this.$el=$(el);
		this.parse();
		return this;
	}
	ViewModel.prototype.parse=function(){
		delete this._binds;
		return this;
	}
	ViewModel.prototype._construct=function(){
		if(!this._cid)
		{
			this._cid=VM.unique('vm');
		}
		
		if(!this.el)
			this.el='div';
		if(typeof this.el == 'string')
		{
			this.el=document.createElement(this.el);
		}
		this.$el=$(this.el);
		this.parse().delegateEvents().initialize();
		return this;
	}
	ViewModel.prototype.initialize=function(){}
	ViewModel.prototype.delegateEvents=function(events){
		events||(events=this.events);
		this.undelegateEvents();
		var fnName,fn,name,eventsPath,eventName,me=this;
		for(name in events)
		{
			
			fnName=events[name];
			fn=me[fnName];
			if(typeof fn != 'function')
				throw TypeError(fnName+' is not a function');
			eventsPath=name.split(eventSplitter);
			eventName=eventsPath.shift()+'.'+this._cid;
			var proxy=function(){
				fn.apply(me,arguments);
			}
			if(eventsPath.length)
			{
				me.$el.delegate(eventsPath.join(' '),eventName,proxy);
			}
			else
			{
				me.$el.bind(eventName,proxy);
			}
		}
		return this;
	}
	ViewModel.prototype.undelegateEvents=function(){
		this.$el.unbind('.'+this._cid);
		return this;
	}
	
	ViewModel.prototype.render=function(){
		return this;
	};
	this.ViewModel=ViewModel;
}).call(this);

