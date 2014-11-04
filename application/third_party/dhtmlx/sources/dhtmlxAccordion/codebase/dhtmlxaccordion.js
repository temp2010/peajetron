/*
Product Name: dhtmlxSuite 
Version: 4.0.3 
Edition: Professional 
License: content of this file is covered by DHTMLX Commercial or Enterprise license. Usage without proper license is prohibited. To obtain it contact sales@dhtmlx.com
Copyright UAB Dinamenta http://www.dhtmlx.com
*/

function dhtmlXAccordion(base, skin) {
	
	var that = this;
	var transData = window.dhx4.transDetect();
	
	this.conf = {
		skin: (skin||window.dhx4.skin||(typeof(dhtmlx)!="undefined"?dhtmlx.skin:null)||window.dhx4.skinDetect("dhxacc")||"dhx_skyblue"),
		icons_path: "",
		multi_mode: false,
		last_opened: null, // single_mode only
		on_active_id: null, // id for onActive in single_mode, inner
		on_active_click: false, // activation by click or by script
		size_changed: true,
		def_height: 90, // defult height
		// items count
		total_count: 0,
		hiden_count: 0,
		base_w: null,
		// fullscreen conf
		fs_mode: false,
		fs_tm: null, // resize tm
		fs_base_ofs: {w:2,h:2} // offset for base in fullscreen mode
	};
	
	// effects
	this.conf.tr = {
		prop: transData.transProp, // false if not available
		ev: transData.transEv,
		height_open: "height 0.2s cubic-bezier(0.25,0.1,0.25,1)", // cell open/close by click
		height_close: "height 0.18s cubic-bezier(0.25,0.1,0.25,1)", // cell open/close by click
		op_open: "opacity 0.16s ease-in", // cell_cont on open
		op_close: "opacity 0.2s ease-out", // cell_cont on close
		op_v_open: "1", // opacity for opened cell
		op_v_close: "0.4", // opacity for closed cell
		dnd_top: "top 0.16s" // dnd
	};
	
	// cells offsets
	this.ofs = {
		// working values, will generated by _applyOffsets
		m:{}, // multi_mode
		s:{},  // single_mode
		// default offset, based on skyblue
		def: {
			m: { // multi_mode
				left: 0, // horizontal offset between parent-edge and cell for both left and right sides
				right: 0, // cell to edge from right
				first: 0, // top before first
				between: 8 // vertical offset between cells for multi_mode
			},
			s: { // single_mode
				left: 0,
				right: 0,
				first: 0,
				between: -1,
				last: 0 // last cell bottom's and bottom edge
			}
		},
		// override by base (parentId), if base._ofs attr is set, used in attachComponent()
		base: {
			s: {},
			m: {}
		},
		// override by skin
		skin: {
			dhx_web: {
				s: { between: 3 },
				m: { between: 3 }
			},
			dhx_terrace: {
				m: { between: 12, left: 0, right: 0 }
			}
		}
	};
	
	// open/close fix
	if (navigator.userAgent.indexOf("MSIE") >= 0 || navigator.userAgent.indexOf("Trident") >= 0) {
		// ie10, ie11
		this.conf.tr.height_open = this.conf.tr.height_close;
	} else {
		// ff, opera, chrome - good
		this.conf.tr.height_open = this.conf.tr.height_close;
	}
	
	var apiInit = null;
	if (typeof(base) == "object" && !base.tagName) {
		apiInit = {};
		for (var a in base) {
			apiInit[a] = base[a];
			base[a] = null;
		}
		base = apiInit.parent;
		apiInit.parent = null;
	}
	
	if (base == document.body) {
		
		document.documentElement.className += " dhxacc_fullscreen";
		document.body.className += " dhxacc_fullscreen";
		this.conf.fs_mode = true;
		
		this.base = document.createElement("DIV");
		this.base.className = "dhxacc_base_"+this.conf.skin;
		this.base.style.position = "absolute";
		this.base.style.left = this.conf.fs_base_ofs.w+"px";
		this.base.style.top = this.conf.fs_base_ofs.h+"px";
		document.body.appendChild(this.base);
		
	} else {
		
		this.base = (typeof(base) == "string" ? document.getElementById(base) : base);
		base = null;
		
		this.base.className += " dhxacc_base_"+this.conf.skin;
		while (this.base.childNodes.length > 0) this.base.removeChild(this.base.lastChild);
	}
	
	
	// offset fix, base override
	if (this.base._ofs != null) {
		for (var mode in this.ofs.base) {
			if (this.base._ofs[mode] != null) {
				for (var a in this.base._ofs[mode]) this.ofs.base[mode][a] = this.base._ofs[mode][a];
			}
		}
	}
	
	this._applyOffsets = function() {
		// 1) default
		// 2) skin override if any
		// 3) base._ofs override if any
		for (var mode in this.ofs.def) {
			var def = this.ofs.def[mode];
			var skin = (this.ofs.skin[this.conf.skin] != null && this.ofs.skin[this.conf.skin][mode] != null ? this.ofs.skin[this.conf.skin][mode] : null);
			var base = (this.base._ofs != null ? this.base._ofs[mode] : null);
			for (var a in def) {
				if (skin != null && skin[a] != null) {
					this.ofs[mode][a] = skin[a];
				} else if (base != null && base[a] != null) {
					this.ofs[mode][a] = base[a];
				} else {
					this.ofs[mode][a] = def[a];
				}
			}
		}
	}
	this._applyOffsets();
	
	this.t = {};
	
	this.addItem = function(id, text, open, height, icon) {
		
		// open - open/close new in 4.0, true by default, close prev item if any in single_mode
		// height - for multi_mode, new in 4.0
		
		// create cell
		// extend hdr
		// open/close
		// depending on mode - calculate width/height
		
		if (id == null) id = "a"+window.dhx4.newId();
		while (this.t[id] != null) id = "a"+window.dhx4.newId();
		
		var cell = new dhtmlXAccordionCell(id, this);
		cell.conf.skin = this.conf.skin;
		cell.setText(text);
		if (icon != null) cell.setIcon(icon);
		
		cell.cell._accId = id;
		cell.cell.childNodes[cell.conf.idx.hdr].onselectstart = function(e) {
			e = e||event;
			if (e.preventDefault) e.preventDefault(); else e.returnValue = false;
			return false;
		}
		cell.cell.childNodes[cell.conf.idx.hdr].onclick = function(e) {
			e = e||event;
			if (e.preventDefault) e.preventDefault(); else e.returnValue = false;
			if (that._dnd != null && that._dnd.ofs == true) return; // dnd
			var t = (e.target||e.srcElement);
			var id = null;
			while (t._accId != this && id == null) {
				if (t._accId != null) id = t._accId; else t = t.parentNode;
			}
			if (id != null) that._hdrClick(id);
		}
		
		this.t[id] = {cell: cell};
		
		this.conf.total_count++;
		
		if (this.conf.multi_mode) {
			
			if (typeof(open) == "undefined") open = true; // opened by default if not set
			
			this.base.appendChild(cell.cell);
			
			cell.conf.opened = (open==true);
			if (typeof(height) == "undefined" || height == null || height == "*") {
				if (height == "*") cell.conf.h_auto = true;
				height = this.conf.def_height;
			} else {
				height = Math.max(parseInt(height),30);
			}
			
			// dim
			cell._setSize(this.ofs.m.left, 0, this.conf.base_w||this._getAvailItemWidth(), cell.conf.opened?height:cell._getHdrHeight());
			cell.cell.style.marginTop = (cell.cell==this.base.firstChild?this.ofs.m.first:this.ofs.m.between)+"px";
			if (open != true) {
				cell.conf.size.h = height;
				cell._adjustCell();
				cell.cell.className += " dhx_cell_closed";
			}
			this._adjustOpened();
			
			if (this._dnd != null) this._dndAttachEvent(id);
			
		} else {
			
			// closed by default or force if first node
			open = (this.conf.last_opened==null?true:window.dhx4.s2b(open));
			
			var h = this._updateCellsHeight();
			
			// close prev already opened cell if any or reduce height
			if (this.conf.last_opened != null) {
				if (open) {
					this._closeItem(this.conf.last_opened, false);
				} else {
					var openedCell = this.t[this.conf.last_opened].cell;
					openedCell._setSize(openedCell.conf.size.x, openedCell.conf.size.y, openedCell.conf.size.w, h);
					openedCell = null;
				}
			}
			this.base.appendChild(cell.cell);
			cell.conf.opened = open;
			cell.cell.style.marginTop = String(cell.cell==this.base.firstChild?this.ofs.s.first:this.ofs.s.between)+"px";
			
			cell._setSize(this.ofs.s.left, 0, this.conf.base_w||this._getAvailItemWidth(), open?h:cell._getHdrHeight());
			if (open) {
				this.conf.last_opened = id;
			} else {
				cell.conf.size.h = h;
				cell._adjustCell();
				cell.cell.className += " dhx_cell_closed";
			}
			
		}
		
		cell = null;
		
		return this.t[id].cell;
	}
	
	this.removeItem = function(id) {
		
		if (!this.t[id]) return;
		if (this.conf.last_opened == id) this.conf.last_opened = null;
		if (this.conf.on_active_id == id) this.conf.on_active_id = null;
		
		if (this._dnd != null) this._dndClearCell(id);
		
		this.conf.total_count--;
		if (!this.conf.multi_mode && !this.t[id].cell.conf.visible) this.conf.hiden_count--;
		
		this.t[id].cell._unload();
		this.t[id].cell = null;
		this.t[id] = null;
		delete this.t[id];
		
		if (!this.conf.unloading) {
			if (!this.conf.multi_mode) this._updateCellsMargin();
			this.setSizes();
		}
	}
	
	this.cells = function(id) {
		return this.t[id].cell;
	}
	
	this.enableMultiMode = function(yScrollMode, defaultHeight) { // disabled by default
		this.conf.multi_mode = true;
		if (!isNaN(defaultHeight)) this.conf.def_height = defaultHeight;
		if (yScrollMode == "auto" || yScrollMode == "scroll") {
			this.base.style.overflowX = "hidden";
			this.base.style.overflowY = yScrollMode;
		} else {
			this.base.style.overflow = "visible";
		}
	}
	
	this.forEachItem = function(func) {
		for (var a in this.t) {
			if (typeof(func) == "function") {
				func.apply(this, [this.t[a].cell]);
			} else {
				if (typeof(func) == "string" && typeof(window[func]) == "function") window[func].apply(this, [this.t[a].cell]);
			}
		}
	}
	
	this._openItem = function(id, ef) {
		
		if (typeof(ef) == "undefined") ef = true;
		
		if (this.t[id].cell.conf.opened == false) {
			
			if (this.conf.multi_mode) {
				
				this.t[id].cell._open(ef);
				
			} else {
				
				if (this.conf.tr.prop == false) {
					
					// simple open/close
					if (this.conf.last_opened != null) this.t[this.conf.last_opened].cell._close(false);
					this.t[id].cell._open(false);
					this.conf.last_opened = id;
					
				} else {
					this.conf.on_active_id = id;
					this.t[id].cell._open(ef);
					if (this.conf.last_opened != null) this.t[this.conf.last_opened].cell._close(ef);
					this.conf.last_opened = id;
				}
			}
		}
	}
	
	this._closeItem = function(id, ef) {
		if (typeof(ef) == "undefined") ef = true;
		if (this.t[id].cell.conf.opened == true) {
			this.t[id].cell._close(ef);
			this.conf.last_opened = null;
		}
	}
	
	this._adjustOpened = function() {
		
		// multi_mode - only width, check v-scroll
		// single_mode - width/height
		
		if (this.conf.multi_mode == true) {
			
			// new edition
			if (this._openCache == null) {
				var dynData = this._getDynData();
				for (var a in dynData) {
					this.t[a].cell.conf.size.h = dynData[a];
					this.t[a].cell.cell.style.height = dynData[a]+"px";
				}
			} else {
				var inProgress = false;
				for (var a in this._openCache) inProgress = (inProgress||this._openCache[a]);
				if (inProgress == true) return;
				this._openCache = this._openId = null;
			}
			
			var w2 = this._getAvailItemWidth();
			for (var a in this.t) {
				var adj = true;
				if (w2 == this.t[a].cell.conf.size.w && (this._openMode == "close" || this.t[a].cell.conf.opened == false)) adj = false;
				if (adj) this.t[a].cell._setWidth(w2);
			}
			
			this._openMode = null;
			
		} else {
			if (this.conf.last_opened != null) {
				var id = this.conf.last_opened;
				this.t[id].cell._setSize(this.t[id].cell.conf.size.x, this.t[id].cell.conf.size.y, this.t[id].cell.conf.size.w, this.t[id].cell.conf.size.h);
			}
		}
	}
	
	this._getDynData = function(toOpen, toClose) {
		
		// toOpen/toClose - static_or_dyn closed cell from _open() or _close(),
		// cells shoule be included into calculations
		if (typeof(toOpen) == "undefined" || toOpen == null) toOpen = {};
		if (typeof(toClose) == "undefined" || toClose == null) toClose = {};
		
		var dynData = {};
		var dynCount = 0;
		var h = 0;
		var f0 = 0; // item index (visible only)
		
		for (var q=0; q<this.base.childNodes.length; q++) {
			var id = this.base.childNodes[q]._accId;
			var t = this.t[id].cell;
			if (t.conf.visible == true) {
				var ofs = this.ofs.m[f0==0?"first":"between"];
				if (toOpen[id] == true || toClose[id] == true || (t.conf.opened == true && t.conf.h_auto == true)) {
					if (toClose[id] == true) {
						var h0 = t._getHdrHeight();
						dynData[id] = h0; // static cell going to opened, include to common h
						h += h0+ofs;
					} else if (t.conf.h_auto == true) { // dyn cell is here, just mark, include margin only
						dynData[id] = true;
						h += ofs;
						dynCount++;
					} else if (toOpen[id] == true) {
						dynData[id] = t.conf.size.h; // static cell going to opened, include to common h
						h += t.conf.size.h+ofs;
					}
				} else {
					h += t.cell.offsetHeight+ofs; // collapsed or static
				}
				f0++;

			}
			t = null;
		}
		
		// 2) calculate height for single h_auto cell
		// (avail_space-static_cells_height-closed_cells_height) / h_auto_cells_count
		
		if (dynCount > 0) {
			var hSum = this.base.offsetHeight-h;
			var h = Math.floor(hSum/dynCount);
			for (var a in dynData) {
				if (dynData[a] == true) {
					if (dynCount > 1) hSum -= h; else h = hSum; // decrease main height each time, last item used all left height
					dynData[a] = h;
					dynCount--;
				}
			}
		}
		
		return dynData;
		
	}
	
	this._adjustBase = function() {
		if (this.conf.fs_mode) {
			this.base.style.width = document.body.offsetWidth-this.conf.fs_base_ofs.w*2+"px";
			this.base.style.height = document.body.offsetHeight-this.conf.fs_base_ofs.h*2+"px";
		}
	}
	
	this.setSizes = function() {
		this._adjustBase();
		if (this.conf.multi_mode == true) {
			this._adjustOpened();
		} else {
			this.conf.base_w = null; // reset saved base width
			var h = this._updateCellsHeight();
			for (var a in this.t) {
				this.t[a].cell._setSize(this.ofs.s.left, 0, this.conf.base_w||this._getAvailItemWidth(), this.t[a].cell.conf.opened?h:this.t[a].cell._getHdrHeight());
				if (!this.t[a].cell.conf.opened) {
					this.t[a].cell.conf.size.h = h;
					this.t[a].cell._adjustCell();
				}
			}
			this.conf.size_changed = true; // for cell-show, recall setSizes()
		}
	}
	
	this.setSkin = function(skin) {
		this.base.className = String(this.base.className).replace(new RegExp("\\s{1,}dhxacc_base_"+this.conf.skin+"\\s{0,}$"), " dhxacc_base_"+skin);
		this.conf.skin = skin;
		for (var a in this.t) {
			this.t[a].cell.conf.cells_cont = null; // reset cached cells offsets
			this.t[a].cell.conf.skin = this.conf.skin;
		}
		this._applyOffsets();
		this._updateCellsMargin();
		this.setSizes();
	}
	
	this.setIconsPath = function(path) {
		this.conf.icons_path = path;
	}
	
	this._getAvailItemWidth = function() {
		// 
		var p = this.ofs[(this.conf.multi_mode?"m":"s")];
		var w = Math.max(this.base.clientWidth-p.left-p.right, 10);
		this.conf.base_w = w;
		p = null;
		return w;
	}
	
	this._updateCellsHeight = function() {
		
		// single_mode only
		if (this.conf.multi_mode == true) return;
		
		var k = this.conf.total_count-this.conf.hiden_count; // visible count
		var h = this.base.offsetHeight-this.ofs.s.last;
		
		if (k == 0) return h;
		
		// single item_heigth = header_height + content_height
		// i.e. base_height - (visible_count-1)*header_height
		var itemFound = false;
		for (var q=0; q<this.base.childNodes.length; q++) {
			if (itemFound == false) {
				var id = this.base.childNodes[q]._accId;
				if (this.t[id].cell.conf.visible) {
					h -= this.t[id].cell._getHdrHeight()*(k-1);
					itemFound = true;
				}
			}
		}
		
		// all items except 1st have top-padding=-1, include it into cell height
		h -= (k-1)*this.ofs.s.between+this.ofs.s.first;
		
		for (var a in this.t) {
			// check if item inited
			if (this.t[a].cell.conf.size != null) {
				this.t[a].cell.conf.size.h = h;
				this.t[a].cell._adjustCell();
			}
		}
		
		return h;
	}
	
	this._updateCellsMargin = function() {
		
		var f0 = 0;
		for (var q=0; q<this.base.childNodes.length; q++) {
			var id = this.base.childNodes[q]._accId;
			if (this.t[id].cell.conf.visible) {
				this.t[id].cell.cell.style.marginTop = String(this.ofs[this.conf.multi_mode?"m":"s"][f0++==0?"first":"between"])+"px";
			}
		}

	}
	
	this._hdrClick = function(id) {
		
		if (!this.conf.multi_mode && this.t[id].cell.conf.opened) return; // not allow click-close in single-open mode
		
		var opened = this.t[id].cell.conf.opened;
		if (this.callEvent("onBeforeActive",[id,(opened?false:true)]) !== true) return; // doc do not have 2nd param, remove or change to true/false like for onActive
		
		this.conf.on_active_click = true;
		this[opened?"_closeItem":"_openItem"](id);
		if (this.conf.multi_mode && this.conf.tr.prop == false) this._adjustOpened();
	}
	
	this.unload = function() {
		
		this.conf.unloading = true;
		
		for (var a in this.t) this.removeItem(a);
		this.t = null;
		
		if (typeof(this._unloadDND) == "function") this._unloadDND();
		
		if (this.conf.fs_mode) {
			if (this.conf.fs_tm) window.clearTimeout(this.conf.fs_tm);
			if (window.addEventListener) {
				window.removeEventListener("resize", this._doOnResizeStart, false);
			} else {
				window.detachEvent("onresize", this._doOnResizeStart);
			}
			this._doOnResizeStart = null;
			this._doOnResizeEnd = null;
			this.conf.fs_tm = null;
		}
		
		if (this.dhxWins) {
			this.dhxWins.unload();
			this.dhxWins = null;
		}
		
		window.dhx4._eventable(this, "clear");
		window.dhx4._enableDataLoading(this, null, null, null, "clear");
		
		this.base.className = String(this.base.className).replace(new RegExp("\\s{1,}dhxacc_base_"+this.conf.skin+"\\s{0,}$"), "");
		this.base = null;
		
		this.ofs = this.conf = null;
		
		for (var a in this) this[a] = null;
		
		that = null;
		
	}
	
	this.setOffset = function(ofsBetween) { // offset "between" cells, not in doc but public in prev version
		this.ofs.s.between = ofsBetween;
		this.ofs.m.between = ofsBetween;
		this._updateCellsMargin();
		this.setSizes();
	}
	
	this._initObj = function(data) {
		if (data.skin != null) {
			this.setSkin(data.skin);
		}
		if (window.dhx4.s2b(data.multi_mode)) {
			this.enableMultiMode();
		}
		if (data.icons_path != null) {
			this.setIconsPath(data.icons_path);
		}
		if (data.icon_path != null) { // back compat
			this.setIconsPath(data.icon_path);
		}
		if (data.items != null) {
			for (var q=0; q<data.items.length; q++) {
				this.addItem(data.items[q].id, data.items[q].text, data.items[q].open, data.items[q].height, data.items[q].icon||data.items[q].img);
			}
		}
		if (window.dhx4.s2b(data.dnd) == true && typeof(this.enableDND) == "function") {
			this.enableDND();
		}
	}
	
	this._xmlToObj = function(data) {
		var t = {items:[]};
		var root = data.getElementsByTagName("accordion")[0];
		if (root.getAttribute("skin") != null) t.skin = root.getAttribute("skin");
		if (root.getAttribute("mode") == "multi") t.multi_mode = true;
		if (root.getAttribute("multiMode") != null) t.multi_mode = window.dhx4.s2b(root.getAttribute("multiMode"));
		if (root.getAttribute("iconsPath") != null) t.icons_path = root.getAttribute("iconsPath");
		for (var q=0; q<root.childNodes.length; q++) {
			var p = root.childNodes[q];
			if (typeof(p.tagName) != "undefined" && String(p.tagName).toLowerCase() == "cell") {
				var k = {};
				if (p.getAttribute("id") != null) k.id = p.getAttribute("id");
				if (p.getAttribute("icon") != null) k.icon = p.getAttribute("icon");
				if (p.getAttribute("height") != null) k.height = p.getAttribute("height");
				if (p.getAttribute("open") != null) k.open = window.dhx4.s2b(p.getAttribute("open"));
				k.text = p.firstChild.nodeValue;
				t.items.push(k);
			}
			p = null;
		}
		return t;
	}
	
	window.dhx4._enableDataLoading(this, "_initObj", "_xmlToObj", "accordion", {struct:true});
	window.dhx4._eventable(this);
	
	this._callMainEvent = function(name, args) {
		return this.callEvent(name, args);
	}
	
	// attach/detach content improves
	this.attachEvent("onActive", function(id){
		// open/close - editor save state/make editable
		if (this.t[id].cell.dataObj != null && this.t[id].cell.dataType == "editor") {
			this.t[id].cell.dataObj._prepareContent(true);
		}
		// adjust progress if it was activated while cell was closed
		if (this.t[id].cell.conf.opened == true) {
			this.t[id].cell._adjustProgress();
		}
	});
	
	if (this.conf.fs_mode) {
		
		this._adjustBase();
		
		// fullscreen resize events
		this.conf.fs_tm = null;
		this._doOnResizeStart = function() {
			if (that.conf.fs_tm) window.clearTimeout(that.conf.fs_tm);
			that.conf.fs_tm = window.setTimeout(that._doOnResizeEnd, 200);
		}
		
		this._doOnResizeEnd = function() {
			that.setSizes();
		}
		
		if (window.addEventListener) {
			window.addEventListener("resize", this._doOnResizeStart, false);
		} else {
			window.attachEvent("onresize", this._doOnResizeStart);
		}
		
	}
	
	if (typeof(window.dhtmlXWindows) == "function") {
		this.dhxWins = new dhtmlXWindows();
		this.dhxWins.setSkin(this.conf.skin);
	}
	
	if (apiInit != null) {
		this._initObj(apiInit);
		apiInit = null;
	}
	
	return this;
	
};

/* cell extensions */
function dhtmlXAccordionCell(id, acc) {
	
	dhtmlXCellObject.apply(this, [id, "_acc"]);
	
	this.acc = acc;
	
	this.conf.visible = true;
	this.conf.docked = true;
	
	this.attachEvent("_onCellUnload", function(){
		
		this._trDetachEv();
		this._unloadDocking();
		
		this.acc = null;
		this.cell._accObj = null;
		
		this.cell.childNodes[this.conf.idx.hdr].onselectstart = null;
		this.cell.childNodes[this.conf.idx.hdr].onclick = null;
		
		this._initHeader = null;
		this._getHdrHeight = null;
		this._setWidth = null;
		this._adjustCell = null;
		this._open = null;
		this._close = null;
		this._isOpened = null;
		this._trInitEv = null;
		this._trAttachEv = null;
		this._trDetachEv = null;
		this._trOnEnd = null;
		this._onActiveCall = null;
		this.setText = null;
		this.getText = null;
		this.setIcon = null;
		this.clearIcon = null;
		this.show = null;
		this.hide = null;
		this.isVisible = null;
		this.setHeight = null;
		this.moveOnTop = null;
		
	});
	
	this.attachEvent("_onContentLoaded", function() {
		this.acc._callMainEvent("onContentLoaded", arguments);
	});
	
	// init header
	this._initHeader();
	
	// open/close, check trans-effects
	this.conf.tr = {};
	for (var a in this.acc.conf.tr) this.conf.tr[a] = this.acc.conf.tr[a];
	
	if (this.conf.tr.prop != false) {
		this.attachEvent("_onIdxUpdated", function(){
			// if cell hidden - update opacity for menu/toolbar/status attached
			this._cellSetOpacity((this.conf.opened?"open":"close"), false);
		});
	}
	
	// open/close
	this.open = function() {
		this.acc._openItem(this._idd);
	}
	this.close = function() {
		this.acc._closeItem(this._idd);
	}
	
	// misc
	this._setWidth = function(w) {
		if (w != this.conf.size.w) {
			this.conf.size.w = w;
			this.cell.style.width = w+"px";
		}
		this._adjustCell();
	}
	
	this._adjustCell = function() {
		this._adjustCont();
		if (this.dataObj != null && typeof(this.dataObj.setSizes) == "function") {
			this.dataObj.setSizes();
		}
	}
	
	this._initDocking();
	return this;
	
};

dhtmlXAccordionCell.prototype = new dhtmlXCellObject();

/* header */
dhtmlXAccordionCell.prototype._initHeader = function() {
	
	var t = document.createElement("DIV");
	t.className = "dhx_cell_hdr";
	t.innerHTML = "<div class='dhx_cell_hdr_text'></div>"+
			"<div class='dhx_cell_hdr_arrow'></div>";
	
	this.cell.insertBefore(t, this.cell.childNodes[this.conf.idx.cont]);
	t = null;
	
	// include into content top offset calculation
	this.conf.ofs_nodes.t._getHdrHeight = "func";
	
	// show/hide
	this.conf.hdr = {visible: true};
	
	// include into index
	this.conf.idx_data.hdr = "dhx_cell_hdr";
	this._updateIdx();
	
};

dhtmlXAccordionCell.prototype._getHdrHeight = function() {
	return this.cell.childNodes[this.conf.idx.hdr].offsetHeight;
};


dhtmlXAccordionCell.prototype.setText = function(text) {
	this.conf.text = text;
	this.cell.childNodes[this.conf.idx.hdr].firstChild.innerHTML = "<span>"+text+"</span>";
};

dhtmlXAccordionCell.prototype.getText = function() {
	return this.conf.text;
};

/* header icon */
dhtmlXAccordionCell.prototype.setIcon = function(icon) {
	var t = this.cell.childNodes[this.conf.idx.hdr];
	if (t.firstChild.className != "dhx_cell_hdr_icon") {
		t.firstChild.className += " dhx_cell_hdr_icon";
		var k = document.createElement("IMG");
		k.className = "dhx_cell_hdr_icon";
		t.insertBefore(k, t.firstChild);
		k = null;
	}
	t.firstChild.src = this.acc.conf.icons_path+icon;
	t = null;
};

dhtmlXAccordionCell.prototype.clearIcon = function() {
	var t = this.cell.childNodes[this.conf.idx.hdr];
	if (t.firstChild.className == "dhx_cell_hdr_icon") {
		t.removeChild(t.firstChild);
		t.firstChild.className = String(t.firstChild.className).replace(/\s{1,}dhx_cell_hdr_icon/gi,"");
	}
	t = null;
};

/* open/close */
dhtmlXAccordionCell.prototype._open = function(ef) {
	
	var dynData = {};
	
	if (this.acc.conf.multi_mode) {
		
		var toOpen = {};
		toOpen[this._idd] = true;
		dynData = this.acc._getDynData(toOpen);
		
		this.acc._openId = this._idd;
		this.acc._openCache = {};
		this.acc._openMode = "open";
		
	} else {
		
		// h_auto cells not found, simple change height of current cell
		dynData[this._idd] = this.conf.size.h;
		
	}
	
	for (var a in dynData) {
		
		if (this.acc._openCache != null) this.acc._openCache[a] = true;
		
		var t = this.acc.t[a].cell;
		t.cell.className = String(t.cell.className).replace(/\s{1,}dhx_cell_closed/gi,"");
		t.conf.opened = true;
		t._trInitEv("open", ef);
		t.conf.size.h = dynData[a];
		t.cell.style.height = t.conf.size.h+"px"; // restore last height
		t = null;
		
	}
	
	// effect is not enabled, adjust cells after resize
	if (this.conf.tr.prop == false) {
		this.acc._openId = this.acc._openCache = this.acc._openMode = null;
		this._onActiveCall(true);
	}
	
};

dhtmlXAccordionCell.prototype._close = function(ef) {
	
	var dynData = {};
	
	if (this.acc.conf.multi_mode) {
		
		var toClose = {};
		toClose[this._idd] = true;
		dynData = this.acc._getDynData(null, toClose);
		
		this.acc._openId = this._idd;
		this.acc._openCache = {};
		this.acc._openMode = "close";
		
	} else {
		
		dynData[this._idd] = this._getHdrHeight();
	}
	
	for (var a in dynData) {
		
		var t = this.acc.t[a].cell;
		
		if (this.acc._openCache != null) this.acc._openCache[a] = true;
		if (a == this._idd) {
			t.cell.className += " dhx_cell_closed";
			t.conf.opened = false;
			t._trInitEv("close", ef);
		} else {
			// keep opened
			t.conf.size.h = dynData[a];
			t._adjustCell();
			t._trInitEv("open", ef);
		}
		
		t.cell.style.height = dynData[a]+"px"; // set height as hdr height
		
		t = null;
	}
	
	if (this.conf.tr.prop == false) {
		this.acc._openId = this.acc._openCache = this.acc._openMode = null;
		this._onActiveCall(false);
	}
};

dhtmlXAccordionCell.prototype.isOpened = function() {
	return (this.conf.opened==true);
};

dhtmlXAccordionCell.prototype._trInitEv = function(mode, ef) {
	
	if (this.conf.tr.prop == false) return;
	this._trAttachEv();
	
	if (!this.cell._accObj) this.cell._accObj = this.acc; // acc obj for transion end
	
	// open with effect (usualy by click, w/o usualy on init stage)
	if (ef) {
		this.cell.style[this.conf.tr.prop] = this.conf.tr["height_"+mode];
	}
	
	// opacity
	this._cellSetOpacity(mode, ef);
};

dhtmlXAccordionCell.prototype._trAttachEv = function() {
	if (!this.conf.tr.ev_attached) {
		this.cell._trProp = this.conf.tr.prop;
		this.cell.addEventListener(this.conf.tr.ev, this._trOnEnd, false);
		this.conf.tr.ev_attached = true;
	}
};
dhtmlXAccordionCell.prototype._trDetachEv = function() {
	if (this.conf.tr.ev_attached) {
		this.cell.addEventListener(this.conf.tr.ev, this._trOnEnd, false);
		this.conf.tr.ev_attached = false;
	}
};

dhtmlXAccordionCell.prototype._trOnEnd = function(ev) {
	if (ev.stopPropagation) ev.stopPropagation();
	if (ev.propertyName == "height") {
		this.style[this._trProp] = "";
		if (this._accObj.conf.multi_mode) {
			if (this._accObj._openCache != null) this._accObj._openCache[this._accId] = false;
			this._accObj._adjustOpened();
		}
		if (this._accObj.conf.on_active_click == true) {
			if (this._accObj.conf.multi_mode) {
				this._accObj._callMainEvent("onActive", [this._accId, this._accObj.t[this._accId].cell.conf.opened]);
				this._accObj.conf.on_active_click = false;
			} else {
				this._accObj._callMainEvent("onActive", [this._accObj.conf.on_active_id, true]);
				this._accObj.conf.on_active_id = null;
				this._accObj.conf.on_active_click = false;
			}
		}
		this._accObj = null;
	}
};

dhtmlXAccordionCell.prototype._cellSetOpacity = function(mode, ef) {
	// mode - "open"/"close"
	for (var a in this.conf.idx) {
		if ({hdr:true,pr1:true,pr2:true}[a] != true) { // skip hdr and progress
			if (ef) this.cell.childNodes[this.conf.idx[a]].style[this.conf.tr.prop] = this.conf.tr["op_"+mode];
			this.cell.childNodes[this.conf.idx[a]].style.opacity = this.conf.tr["op_v_"+mode];
		}
	}
};

dhtmlXAccordionCell.prototype._onActiveCall = function(mode) {
	if (this.acc.conf.on_active_click == false) return;
	if (this.acc.conf.multi_mode == true) {
		this.acc._callMainEvent("onActive", [this._idd, this.conf.opened]);
		this.acc.conf.on_active_click = false;
	} else {
		// single_mode, call only for opened
		if (mode == true) {
			this.acc._callMainEvent("onActive",[this._idd, true]);
			this.acc.conf.on_active_click = false;
		}
	}
	
};

/* visibility */
dhtmlXAccordionCell.prototype.show = function() {
	if (this.conf.visible) return;
	
	if (this.conf.docked == false) { // if cell is undocked - show after dock
		this.dock();
		return;
	}
	
	this.cell.style.display = "";
	this.conf.visible = true;
	if (!this.acc.conf.multi_mode) {
		this.acc.conf.hiden_count--;
		this.acc._updateCellsHeight();
		this.acc._updateCellsMargin();
	}
	if (this.acc.conf.size_changed) {
		this.acc.setSizes();
		this.acc.conf.size_changed = false;
	} else {
		this.acc._adjustOpened();
	}
};

dhtmlXAccordionCell.prototype.hide = function() {
	if (!this.conf.visible) return;
	if (!this.acc.conf.multi_mode && this.conf.opened) { // close before hide if any
		this._close(false);
		this.acc.conf.last_opened = null;
	}
	this.cell.style.display = "none";
	this.conf.visible = false;
	if (!this.acc.conf.multi_mode) {
		this.acc.conf.hiden_count++;
		this.acc._updateCellsHeight();
		this.acc._updateCellsMargin();
	}
	this.acc._adjustOpened();
};

dhtmlXAccordionCell.prototype.isVisible = function() {
	return (this.conf.visible==true);
};

/* height */
dhtmlXAccordionCell.prototype.setHeight = function(h) { // multi_mode only
	
	if (!this.acc.conf.multi_mode) return;
	
	if (h == "*") {
		this.conf.h_auto = true;
	} else {
		this.conf.h_auto = false;
		this.conf.size.h = h;
	}
	
	if (this.conf.opened) {
		if (h != "*") this.cell.style.height = h+"px";
		this.acc._adjustOpened();
	}
};

/* position */
dhtmlXAccordionCell.prototype.moveOnTop = function() {
	if (this.cell.parentNode.firstChild == this.cell) return; // item moved
	this.cell.parentNode.insertBefore(this.cell, this.cell.parentNode.firstChild);
	this.acc._updateCellsMargin();
};


/* dock/undock */
dhtmlXAccordionCell.prototype._initDocking = function() {
	
	var that = this;
	
	this.dock = function() {
		
		if (this.acc.dhxWins == null || this.conf.docked == true) return;
		var w1 = this.acc.dhxWins.window(this._idd);
		w1.close();
		
		// move content
		this._attachFromCell(w1);
		this.conf.docked = true;
		this.show();
		
		if (this.conf.dock_opened) this.open();
		
		w1 = null;
		this.acc._callMainEvent("onDock", [this._idd]);
	};
	
	this.undock = function(x, y, w, h) {
		
		if (this.acc.dhxWins == null || this.conf.docked == false) return;
		
		this.conf.dock_opened = this.conf.opened;
		
		if (this.acc.dhxWins.window(this._idd) != null) {
			var w1 = this.acc.dhxWins.window(this._idd);
			w1.show();
		} else {
			if (x == null) x = 20;
			if (y == null) y = 20;
			if (w == null) w = 320;
			if (h == null) h = 200;
			
			var w1 = this.acc.dhxWins.createWindow(this._idd, x, y, w, h);
			w1.button("close").hide();
			
			// dock button
			w1.addUserButton("dock", 99, "Dock");
			w1.button("dock").show();
			w1.button("dock").attachEvent("onClick", this._doOnDockClick);
			
			// text update only first time
			w1.setText(this.getText());
			
			// closeing
			w1.attachEvent("onClose", this._doOnDockWinClose);
		}
		this.conf.docked = false;
		this.hide();
		
		// move content
		w1._attachFromCell(this);
		w1 = null;
		
		this.acc._callMainEvent("onUnDock", [this._idd]);
		
	}
	
	this._doOnDockClick = function() {
		that.dock();
	}
	this._doOnDockWinClose = function(win) {
		win.hide();
		return false;
	}
	
	this._unloadDocking = function() {
		that = null;
	}
};
