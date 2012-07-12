if (!window['JSViz']) { window.JSViz = {}; }

(function(pkg) {
	"use strict";
	
	function ProgressView() {
		var _this = this;
		this.width  = 256;
		this.height = 256;
		this.canvas = document.createElement('canvas');
		this.canvas.style.borderRadius = "8px";
		this.canvas.style.backgroundColor = "rgba(0,0,0,0.6)";
		this.canvas.style.position = "absolute";
		this.canvas.setAttribute('class', 'progress-box-canvas');
		
		this.canvas.setAttribute('width', this.width);
		this.canvas.setAttribute('height', this.height);
		this.g = this.canvas.getContext('2d');
		
		this.captionHeight = 32;
		this.sidePadding = 24;
		this.rankMap = {};
		this.nodeMap = {};
		this.edgeMap = {};
		this.rankIndexList = [];
		
		this.prevProgress = null;
		this.currentProgress = null;
		
		this.animationT = 0;
		this.prevTime = 0;
		this.callTickAnimation = function() {
			_this.tickAnimation();
		};
		
	}
	
	ProgressView.prototype = {
		getElement: function() {
			return this.canvas;
		},
		
		clearAll: function() {
			clear_hash(this.rankMap);
			clear_hash(this.nodeMap);
			clear_hash(this.edgeMap);
			this.rankIndexList.length = 0;
			this.prevProgress = null;
			this.currentProgress = null;
		},
		
		autoFit: function() {
			var w = $(window);
			var _this = this;
			var s = this.canvas.style;
			var onResize = function() {
				var cx = Math.floor((w.width()  - _this.width) / 2);
				var cy = Math.floor((w.height() - _this.height) / 2);
				s.left = cx + 'px';
				s.top  = cy + 'px';
			};
			
			w.resize(onResize);
			onResize();
		},
		
		setNext: function(pg) {
			this.prevProgress = this.currentProgress;
			this.currentProgress = pg;
			if (pg.state == PROGRESS_AFTER_POSITION) {
				pg.useXCoord = true;
			}
			
			this.updateRankMap();
			this.updateNodeMap();
			this.updateEdgeMap();
		},
		
		updateRankMap: function() {
			var pg = this.currentProgress;
			for (var rk in pg.rankMap) {
				if (!this.rankMap[rk]) {
					this.rankIndexList.push(rk - 0);
					this.rankMap[rk] = new ProgressView.Rank(rk);
				}
				
				this.rankMap[rk].newLength = pg.rankMap[rk].length;
			}
			
			this.rankIndexList.sort(function(a,b){return a-b;});
		},
		
		updateNodeMap: function() {
			var xMin = Infinity;
			var xMax = -Infinity;
			
			var pg = this.currentProgress;
			for (var rk in pg.rankMap) {
				var nodeList = pg.rankMap[rk];
				for (var i in nodeList) {
					var nodeData = nodeList[i];
					var nodeBox = this.regsterNodeBoxFor(nodeData, rk-0);
					nodeBox.newIndex = i - 0;
					nodeBox.willDisappear = false;
					nodeBox.node.x = nodeData.x;
					if (nodeData.x < xMin) {xMin=nodeData.x;}
					if (nodeData.x > xMax) {xMax=nodeData.x;}
				}
			}
			
			pg.xRange.min = xMin;
			pg.xRange.max = xMax;
		},
		
		updateEdgeMap: function() {
			var pg = this.currentProgress;
			for (var rk in pg.rankMap) {
				var nodeList = pg.rankMap[rk];
				for (var i in nodeList) {
					var nodeData = nodeList[i];
					var edgeList = nodeData.outgoingEdges;
					for (var j in edgeList) {
						var eg = edgeList[j];
					
						var egName = makeEdgeName(eg);
						var edgeBox = this.registerEdgeBoxFor(egName, eg);
						edgeBox.willDisappear = false;
					}
				}
			}
		},
		
		regsterNodeBoxFor: function(nodeData, rankIndex) {
			var p = nodeData.ptr;
			if (!this.nodeMap[p]) {
				this.nodeMap[p] = new ProgressView.NodeBox(nodeData, rankIndex);
			}
			
			return this.nodeMap[p];
		},
		
		registerEdgeBoxFor: function(egName, eg) {
			if (!this.edgeMap[egName]) {
				this.edgeMap[egName] = new ProgressView.EdgeBox(egName, eg);
			}
			
			return this.edgeMap[egName];
		},
		
		showFrame: function(t) {
			this.g.clearRect(0, 0, this.width, this.height);
		
			for (var i in this.rankIndexList) {
				var rankIndex = this.rankIndexList[i];
				var rankData = this.rankMap[rankIndex];
				this.renderRankBox(this.g, rankData, t);
			}
			
			this.renderNodes(this.g, t);
			this.renderEdges(this.g, t);
			this.renderLabel(this.g);
		},
		
		contentWidth: function() {
			return Math.floor(this.width - this.sidePadding*2);
		},
		
		renderLabel: function(g, mid, message) {
			var state = this.currentProgress ? this.currentProgress.state : 0;
			var msg = message || ProgressMessages[state] || ProgressMessages[0];
		
			g.fillStyle = "#fff";
			g.font = mid ? "bold 24px Arial" : "bold 14px Arial";
			g.textAlign = "center";
			g.textBaseline = "bottom";
			g.fillText(msg, this.width >> 1, mid ? ((this.height>>1)+12) : this.captionHeight);
		},
		
		renderRankBox: function(g, rankData, t) {
			var rankCount = this.rankIndexList.length;
			
			var rw = this.contentWidth();
			var rx = this.sidePadding;
			var rh = Math.floor((this.height - this.captionHeight * 2) / rankCount);
			var ry = rh * rankData.index + this.captionHeight + 10;
			
			var alpha = 1;
			if (rankData.emerging) {
				alpha = t * 2.0 - rankData.boxData.delay;
				if(alpha < 0) {alpha=0;}
				if(alpha > 1) {alpha=1;}
				
				rankData.boxData.oldHeight = 0;
				rankData.boxData.oldY = rh * rankCount + this.captionHeight + 10;
			}
			var modT = easeOut(t);
			var _modT = 1.0 - modT;
			
			rankData.boxData.newHeight = rh-2;
			rankData.boxData.newY = ry;
			rankData.boxData.currentY = rankData.boxData.newY * modT + rankData.boxData.oldY * _modT;
			rankData.boxData.currentHeight = rankData.boxData.newHeight * modT + rankData.boxData.oldHeight * _modT;
			
			g.globalAlpha = alpha;
			g.lineWidth = 1;
			g.strokeStyle = '#fff';
			g.strokeRect(
				rx,
				rankData.boxData.currentY,
				rw,
				rankData.boxData.currentHeight);
			g.globalAlpha = 1;
			
			
		},
		
		renderNodes: function(g, t) {
			for (var i in this.nodeMap) {
				this.renderANode(this.nodeMap[i], g, t);
			}
		},
		
		renderANode: function(nodeBox, g, t) {
			var alpha = t * 2.0;
			var modT = easeOut(t);
			var _modT = 1.0 - modT;

			var rankData = this.rankMap[nodeBox.rankIndex];
			if (rankData) {
				
				g.lineWidth = 1;
				g.strokeStyle = '#fff';
				g.fillStyle = '#fff';
				var rw = this.contentWidth() - 8;
				var cx = this.width >> 1;
				var ry = rankData.boxData.currentY + Math.floor(rankData.boxData.currentHeight / 2);
				var offsetY = 0;
				var dotscale = 1;
				var xstep = rw / (rankData.newLength + 1);

				var newX = this.sidePadding + xstep * (nodeBox.newIndex+1);
				if (this.currentProgress.useXCoord) {
					nodeBox.positionedX = 
					    (nodeBox.node.x - this.currentProgress.xRange.min)
					    / (this.currentProgress.xRange.max - this.currentProgress.xRange.min);
					
					newX = this.sidePadding + 4 + rw*nodeBox.positionedX;
				}

				if (nodeBox.emerging) {
					nodeBox.oldX = newX;
					alpha -= 0.3;
				} else if (nodeBox.willDisappear) {
					alpha = 1 - alpha;
					dotscale = 1 + modT;
					newX = nodeBox.oldX;
				} else {
					var shift_len = 8;
					if (nodeBox.oldIndex < nodeBox.newIndex) {
						offsetY = -Math.sin(Math.PI * modT) * shift_len;
					} else if (nodeBox.oldIndex > nodeBox.newIndex) {
						offsetY = Math.sin(Math.PI * modT) * shift_len;
					}
					
					alpha = 1;
				}
				
				if(alpha < 0) {alpha=0;}
				if(alpha > 1) {alpha=1;}

				var is_v = nodeBox.node.v;
				nodeBox.currentX = modT * newX + _modT * nodeBox.oldX;
				nodeBox.currentY = ry + offsetY;
				g.globalAlpha = alpha;
				g.beginPath();
				g.arc(
					nodeBox.currentX,
					nodeBox.currentY,
					is_v ? (2*dotscale) : (4*dotscale),
					0, Math.PI*2, true
				);
				is_v ? g.stroke() : g.fill();
				g.globalAlpha = 1;
			}
		},

		renderEdges: function(g, t) {
			for (var i in this.edgeMap) {
				this.renderAEdge(this.edgeMap[i], g, t);
			}
		},
		
		renderAEdge: function(edgeBox, g, t) {
			var nb1 = this.nodeMap[edgeBox.edge.pTailNode];
			var nb2 = this.nodeMap[edgeBox.edge.pHeadNode];
			
			if (nb1 && nb2) {
				var alpha = 1;
				if (edgeBox.emerging) {
					alpha = t;
				} else if (edgeBox.willDisappear) {
					alpha = 1.0 - t;
				}
				
				if(alpha < 0) {alpha=0;}
				if(alpha > 1) {alpha=1;}

				g.globalAlpha = alpha;
				g.lineWidth = 1;
				g.strokeStyle = '#fff';
				g.beginPath();
				g.moveTo(nb1.currentX, nb1.currentY);
				g.lineTo(nb2.currentX, nb2.currentY);
				g.stroke();
				g.globalAlpha = 1;
			}
		},

		startAnimation: function() {
			this.finishAnimation();
			
			this.show();
			
			this.prevTime = new Date();
			this.animationT = 0.01;
			this.tickAnimation();
		},
		
		show: function() {
			var s = this.canvas.style;
			s.display = 'inline';
			setTimeout(function(){
				s.opacity = 1;
			}, 100);
		},
		
		showLoading: function() {
		},
		
		tickAnimation: function() {
			var curTime = new Date();
			var finished = false;
			var t = (curTime - this.prevTime) / 350.0;
			if (t >= 1.0) {
				t = 1.0;
				finished = true;
			}
			
			this.showFrame(t);
		
			if (!finished) {
				setTimeout(this.callTickAnimation, 20);
			} else {
				this.finishAnimation();
			}
		},
		
		finishAnimation: function() {
			if (this.animationT) {
				this.markExistingRanks();
				this.markExistingNodes();
				this.markExistingEdges();
			
				this.animationT = 0;
			}
		},
		
		hideWithAnimation: function() {
			var s = this.canvas.style;
			s.opacity = 0;
			setTimeout(function(){
				s.display = 'none';
			}, 400);
		},
		
		markExistingRanks: function() {
			for (var rk in this.rankMap) {
				var rd = this.rankMap[rk];
				rd.boxData.oldHeight = rd.boxData.newHeight;
				rd.boxData.oldY = rd.boxData.newY;
				rd.emerging = false;
			}
		},

		markExistingNodes: function() {
			for (var i in this.nodeMap) {
				var nd = this.nodeMap[i];
				if (nd.willDisappear) {
					delete this.nodeMap[i];
				}
				
				nd.emerging = false;
				nd.oldX = nd.currentX;
				nd.oldIndex = nd.newIndex;
				nd.willDisappear = true;
			}
		},
		
		markExistingEdges: function() {
			for (var i in this.edgeMap) {
				var eg = this.edgeMap[i];
				if (eg.willDisappear) {
					delete this.edgeMap[i];
				}
				
				eg.emerging = false;
				eg.willDisappear = true;
			}
		}
	};
	
	ProgressView.Rank = function(index) {
		this.index = index - 0;
		this.emerging = true;
		this.newLength = 1;
		this.boxData = {
			delay: index*0.1,
			currentHeight: 0,
			oldHeight: 0,
			newHeight: 0,
			currentY: 0,
			oldY: 0,
			newY: 0
		};
	};
	
	ProgressView.NodeBox = function(node, ri) {
		this.node = node;
		this.rankIndex = ri;
		this.emerging = true;
		this.willDisappear = false;
		this.oldIndex = 0;
		this.newIndex = 1;
		this.newPositionedX = 0;
		this.oldX = 0;
		
		this.currentX = 0;
		this.currentY = 0;
	};
	
	ProgressView.EdgeBox = function(name, edge) {
		this.edge = edge;
		this.name = name;
		this.emerging = true;
		this.willDisappear = false;
	};
	
	function easeOut(t) {
		return 1.0 - (1-t)*(1-t);
	};
	
	function makeEdgeName(eg) {
		return eg.pTailNode +':'+ eg.pHeadNode;
	}
	
	var ProgressMessages = {
		0: "Building ranks...",
		1: "Building ranks...",
		2: "Solving mincross...",
		3: "Solving mincross...",
		4: "Positioning...",
		6: "Positioning..."
	};
	
	function clear_hash(h) {
		for (var i in h) {delete h[i];}
	}
	
	pkg.ProgressView = ProgressView;
})(window.JSViz);