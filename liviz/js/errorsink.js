
if (!window['JSViz']) { window.JSViz = {}; }

(function(pkg) {
	"use strict";
	
	function ErrorSink(esModule) {
		this.fatalList = [];
		this.fatalMessages = [];
		if (esModule) {
			this.funcLabel = esModule.addFunctionEntry();
			esModule.FUNCTION_TABLE[this.funcLabel] = this.makeClosure();
		}
	}

	ErrorSink.prototype = {
		clear: function() {
			this.fatalList.length = 0;
			this.fatalMessages.length = 0;
		},
		
		load: function(src) {
			this.clear();

			var i;
			for (i in src.fatalList) { this.fatalList.push(src.fatalList[i]); }
			for (i in src.fatalMessages) { this.fatalMessages.push(src.fatalMessages[i]); }
		},
		
		stringify: function() {
			var o = this;
			return JSON.stringify({
				fatalList: o.fatalList,
				fatalMessages: o.fatalMessages
			});
		},
		
		checkGraph: function(esModule, g) {
			if (!g) {
				this.addFatalError(0, "Graph is not generated.");
				return false;
			}
			// following operations will crash when g is null

			var c = esModule._testCountNodes(g);
			if (c < 1) {
				this.addFatalError(0, "Graph must have at least one node.");
			}

			var ec = esModule._countEdges(g);
			if (ec < 1) {
			//	this.addFatalError(0, "Graph must have at least one edge.");
			}

			return false;
		},

		addFatalError: function(lineno, msg) {
			var ls = this.fatalList;
			var len = ls.length;
			for (var i = 0;i < len;i++) {
				if (ls[i] == lineno) {return;}
			}

			ls.push(lineno);
			this.fatalMessages.push(msg || "Syntax error");
		},

		makeClosure: function() {
			var _this = this;
			return function(a,b) { _this.errorFunc(a,b); };
		},

		errorFunc: function(isFatal, lineno) {
			if (isFatal) {
				this.addFatalError(lineno);
			}
		},

		countFatal: function() {
			return this.fatalList.length;
		},
		
		lineNumAt: function(i) {
			return this.fatalList[i];
		},

		messageAt: function(i) {
			return this.fatalMessages[i];
		}
	};


	pkg.ErrorSink = ErrorSink;
})(window.JSViz);

// - - - - - - - - -

