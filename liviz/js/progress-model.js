if (!window['JSViz']) { window.JSViz = {}; }

(function(pkg) {
	"use strict";
	
	function ProgressModel(state) {
		this.state = state;
		this.rankMap = {};
		this.xRange = {min: 0, max: 0};
		this.useXCoord = false;
	}
	
	ProgressModel.prototype = {
		registerNodes: function(rankMap, emModule) {
			var buflen = tempBufferSize;
			var buf    = getTempBuffer(emModule);
			
			var rk;
			var rankIndices = [];
			for (rk in rankMap) {
				rankIndices.push(rk - 0);
			}

			for (rk in rankMap) {
				var nodeList = rankMap[rk];
				
				this.rankMap[rk] = [];
				for (var i in nodeList) {
					var nd = nodeList[i];
					this.rankMap[rk].push(nd);
					var name_len = emModule._getNodeName(nd.ptr-0, buf, buflen);
					if (name_len) {
						var bytes = emExtractArray(emModule, buf, name_len, 'i8');
						nd.name = window.JSViz.utf8bytesToString(bytes);
						nd.outgoingEdges = [];
					}
				}
			}
			
			rankIndices.sort(compareNum);
		},
		
		registerEdges: function(edgeList) {
			for (var rk in this.rankMap) {
				var rankNodeList = this.rankMap[rk];
				for (var i in rankNodeList) {
					var nd = rankNodeList[i];
					addOutgoingEdges(nd, edgeList);
				}
			}
		},
		
		stringify: function() {
			return JSON.stringify({
				rankMap: this.rankMap,
				state: this.state
			}, null, '  ');
		}
	};
	
	ProgressModel.fromJSON = function(j) {
		var pg = new ProgressModel(j.state);
		pg.rankMap = j.rankMap;
		
		return pg;
	};
	
	var tempBuffer = null;
	var tempBufferSize = 256;
	function getTempBuffer(m){
		if (!tempBuffer) { tempBuffer = emCharArray(m, tempBufferSize); }
		return tempBuffer;
	}
	
	function addOutgoingEdges(nd, edgeList) {
		for (var i in edgeList) {
			var eg = edgeList[i];
			if (eg.pTailNode == nd.ptr) {
				nd.outgoingEdges.push(eg);
			}
		}
	}
	
	
	function compareNum(a,b){return a-b;}
	pkg.ProgressModel = ProgressModel;
})(window.JSViz);