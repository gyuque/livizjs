/*
 -> Liviz.js (JSViz) <-
 Interactive GraphViz on DHTML

-- MIT License

Copyright (c) 2011-2012 Satoshi Ueyama

Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the "Software"), to deal in the Software
without restriction, including without limitation the rights to use, copy, modify, 
merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
*/

if (!window['JSViz']) { window.JSViz = {}; }

(function(pkg) {
	"use strict";

	function Graph() {
		this.nodeMap = {__proto__:null};
		this.edgeList = [];
		this.nodeNameMap = {__proto__:null};
		this.edgeNameMap = {__proto__:null};
		this.screenSize = {w:0,h:0};
		this.screenPosition = {x:0, y:0};
		this.nonscaledPosition   = {x:0, y:0};
		this.animatedPosition = {x:0, y:0};
		this.element = null;
	}

	Graph.prototype = {
		countNodes: function() {
			var n = 0;
			for (var i in this.nodeMap) {
				++n;
			}

			return n;
		},

		nodeByAddress: function(p) {
			return this.nodeMap[p-0] || null;
		},
	
		connectEdges: function() {
			var nd;
			for (var i in this.nodeMap) {
				nd = this.nodeMap[i];
				if (!nd.outgoingEdges) {
					nd.outgoingEdges = [];
				}

				nd.outgoingEdges.length = 0;
				this.gatherEdges(nd, nd.outgoingEdges);
			}
		},

		gatherEdges: function(cond, a) {
			var edge;
			for (var i in this.edgeList) {
				edge = this.edgeList[i];
				if (edge.nodeFrom == cond) {
					a.push(edge);
				}
			}
		},

		makeNameMap: function() {
			for (var nodeAddr in this.nodeMap) {
				nodeAddr -= 0;
				var nd = this.nodeMap[nodeAddr];
				this.nodeNameMap[nd.name] = nodeAddr;
			}
			
			for (var ei in this.edgeList) {
				var edge = this.edgeList[ei];
				this.edgeNameMap[edge.makeName()] = edge;
			}
		},

		edgeByName: function(nm) {
			return this.edgeNameMap[nm] || null;
		},

		nodeAddressByName: function(nm) {
			return this.nodeNameMap[nm] || 0;
		},
		
		collectNodes: function(refNameMap, except) {
			var ls = [];
		
			for (var nm in this.nodeNameMap) {
				if (refNameMap) {
					var exists = !!( refNameMap[nm] );
					if (except == exists) { continue; }
				} else {
					if (except === false) { continue; }
				}
				
				ls.push(this.nodeNameMap[nm]);
			}
			
			return ls;
		},
		
		collectEdges: function(refNameMap, except) {
			var ls = [];
		
			for (var nm in this.edgeNameMap) {
				if (refNameMap) {
					var exists = !!( refNameMap[nm] );
					if (except == exists) { continue; }
				} else {
					if (except === false) { continue; }
				}
				
				ls.push(this.edgeNameMap[nm]);
			}
			
			return ls;
		}
	}
	

	function GraphExtractor() {
		this.g = new Graph();
		this.tempBuffer = null;
		this.tempBufferSize = 256;
		this.functionEntries = null;
		this.readEdgeCallbackEntry = null;
	}

	GraphExtractor.prototype = {
		extractFromJSON: function(j) {
			var len = j.length;
			for (var i = 0;i < len;i++) {
				var entry = j[i];
				switch(entry.type) {
				case "N":
					var nd = this.addNode(
						entry.address, 
						entry.x, 
						entry.y, 
						entry.w, 
						entry.h, 
						entry.nSides, 
						entry.nPeripheries, 
						entry.fontSize, 
						entry.penWidth
					);
					nd.name = entry.name;
					break;
				case "E":
					var eg = this.addEdge(false,
						null,
						entry.address,
						entry.rawSplineArray,
						entry.pN1,
						entry.pN2,
						0,
						entry.arrX,
						entry.arrY
					);
					
					eg.penColor = entry.penColor;
					eg.label = entry.label;
					break;
				}
				// console.log(i+": ",entry)
			}
			
			this.g.connectEdges();
			this.g.makeNameMap();
		},
	
		extract: function(esModule, g, build_only) {
			var _this = this;
			
			this.tempBuffer = emCharArray(esModule, this.tempBufferSize);
			var e_max = 400;
			var edgeCoordsArray = emDoubleArray(esModule, e_max);

			// make entry point
			if (!this.functionEntries) {
				this.functionEntries = {addNode: null, addEdge: null};
				this.functionEntries.addNode = esModule.addFunctionEntry();
				this.functionEntries.addEdge = esModule.addFunctionEntry();
			}

			esModule.FUNCTION_TABLE[this.functionEntries.addNode] = 
				function(pNode, x, y, w, h, s, pe, fs, pw) {return _this.addNode(pNode, x, y, w, h, s, pe, fs, pw);};

			esModule.FUNCTION_TABLE[this.functionEntries.addEdge] = 
				function(pEdge, pN1, pN2, edgeDataLength, ax,ay) { return _this.addEdge(build_only, esModule, pEdge, edgeCoordsArray, pN1, pN2, edgeDataLength, ax,ay); };

			esModule._extractGraph(
				this.functionEntries.addNode, 
				this.functionEntries.addEdge, 
				edgeCoordsArray, e_max, g);

			if (!build_only) {
				this.g.connectEdges();
			}
			
			this.readNodeNames(esModule, this.g);
			this.readEdgeExtras(esModule, this.g);

			if (!build_only) {
				this.g.makeNameMap();
			}
		},
		
		stringify: function(additional) {
			var injectList = [additional];
			for (var nodeAddr in this.g.nodeMap) {
				var nd = this.g.nodeMap[nodeAddr];
				injectList.push({
					type: "N",
					address: nd.address,
					name: nd.name,
					x: nd.x,
					y: nd.y,
					w: nd.w,
					h: nd.h,
					fontSize: nd.fontSize,
					penWidth: nd.penWidth,
					nSides: nd.nSides,
					nPeripheries: nd.nPeripheries
				});
			}

			for (var ei in this.g.edgeList) {
				var edge = this.g.edgeList[ei];
				injectList.push({
					type: "E",
					address: edge.pointer,
					pN1: edge.nodeFrom.address,
					pN2: edge.nodeTo.address,
					rawSplineArray: edge.rawSplineArray,
					arrX: edge.arrowVector.x,
					arrY: edge.arrowVector.y,
					penColor: edge.penColor,
					label: edge.label
				});
			}
			
			return JSON.stringify(injectList);
		},

		addEdge: function(shouldSaveRawArray, esModule, pEdge, edgeCoordsArray, pN1, pN2, edgeDataLength, arrX, arrY) {
//			console.log(pN1 +' -> '+ pN2);
			if (edgeDataLength >= 0 || !esModule) {
				var coords;
				if (esModule) {
					coords = emExtractArray(esModule, edgeCoordsArray, edgeDataLength, 'double');
				} else {
					coords = edgeCoordsArray;
				}
		
				var edge = new GVEdge(pEdge, this.g.nodeMap[pN1], this.g.nodeMap[pN2]);
				edge.readSplines(coords);

				edge.arrowVector.x = -arrX;
				edge.arrowVector.y = arrY;
				
				if(shouldSaveRawArray){ edge.rawSplineArray = coords; }

				this.g.edgeList.push(edge);
				
				return edge;
			} else {
				// bad: overflow?
			}
		},

		addNode: function(pNode, x, y, w, h, nSides, nPeripheries, fontSize, penWidth) {
			// console.log(nSides, nPeripheries, fontSize);
			this.g.nodeMap[pNode] = {
				name: null,
				address: pNode,
				x: x, //   |position on key frame
				y: y, // --+
				sx: x, //    |position on current frame
				sy: y, // ---+
				w: w,
				h: h,
				element: null,
				willAppear: true,
				fontSize: fontSize,
				penWidth: penWidth,
				nSides: nSides,
				nPeripheries: nPeripheries,
				outgoingEdges: null,
				tweenSchedule: instantiateTweenSchedule(),
				emgOrder: 0
			};
			
			return this.g.nodeMap[pNode];
		},
		
		readNodeNames: function(esModule, g) {
			var buflen = this.tempBufferSize;
			var buf    = this.tempBuffer;

			for (var p in g.nodeMap) {
				var nd = g.nodeMap[p];
				var name_len = esModule._getNodeName(p-0, buf, buflen);
				if (name_len) {
					var bytes = emExtractArray(esModule, buf, name_len, 'i8');
					nd.name = window.JSViz.utf8bytesToString(bytes);
//					console.log(bytes)
				}
			}
		},
		
		readEdgeExtras: function(esModule, g) {
			var buflen = this.tempBufferSize;
			var buf    = this.tempBuffer;
			for (var i in g.edgeList) {
				var edge = g.edgeList[i];
				var slen = esModule._getEdgeColor(edge.pointer, buf, buflen);
				if (slen > 0) {
					var colorName = window.JSViz.utf8bytesToString( emExtractArray(esModule, buf, slen, 'i8') );
					edge.penColor = colorName;
				}

				this.readEdgeLabel(g, esModule, edge);
			}
		},

		readEdgeLabel: function(g, esModule, edge) {
			if (this.readEdgeCallbackEntry === null) {
				this.readEdgeCallbackEntry = esModule.addFunctionEntry();
			}

			esModule.FUNCTION_TABLE[this.readEdgeCallbackEntry] = function(text, slen, fontSize, spaceX,spaceY, posX,posY) {
				var labelText = window.JSViz.utf8bytesToString( emExtractArray(esModule, text, slen, 'i8') );
				edge.label = {
					text: labelText,
					fontSize: fontSize,
					x: posX,
					y: posY,
					spaceX: spaceX,
					spaceY: spaceY
				};
			};

			var hasLabel = !! esModule._getEdgeLabel(g, edge.pointer, this.readEdgeCallbackEntry);
		}
	};


	function GVEdge(pEdge, n1, n2) {
		this.pointer  = pEdge;
		this.elements = null;
		this.penColor = null;
		this.nodeFrom = n1;
		this.nodeTo   = n2;
		this.rawSplineArray = null;
		this.splineList = null;
		this.arrowVector = new Vec2();
		this.edgeTween = null;
		this.labelTween = {
			type: 0,
			ref: null,
			willChange: false,
			phase: 0
		};
		
		this.eflag = 0;
		this.pen = 0;
		this.animatedCurve = null;
		this.tweenSchedule = instantiateTweenSchedule();
		this.label = null;
	}

	var ET_EMERGE    = 0;
	var ET_MOVE      = 1;
	var ET_DISAPPEAR = 2;

	GVEdge.prototype = {
		createEdgeTween: function(animationType, refEdgeOrOffset) {
			var twn;
			if (animationType == ET_EMERGE) {
				var minEdge = CurveTween.createStraight(this.firstPoint(), this.lastPoint(), 0.1, refEdgeOrOffset);
				twn = CurveTween.createTween(minEdge, this.makeCurve(), true);
			} else if (animationType == ET_MOVE) {
				twn = CurveTween.createTween(refEdgeOrOffset.makeCurve(), this.makeCurve());
			} else {
				twn = CurveTween.createFadeOutTween(this.makeCurve());
			}
			
			this.edgeTween = twn;
			this.animatedCurve = new CurveTween.Curve();

			this.labelTween.type = animationType;
			this.labelTween.phase = 0;
			if (animationType == ET_MOVE) {
				this.labelTween.ref = refEdgeOrOffset.label;
				this.labelTween.willChange = this.isLabelChanged(refEdgeOrOffset);
			} else {
				this.labelTween.willChange = true;
			}
			
			return twn;
		},

		isLabelChanged: function(refEdge) {
			var L1 = this.label;
			var L2 = refEdge.label;
		
			if (!L1 && !L2) {return false;}
			if (!L1 && L2) {return true;}
			if (L1 && !L2) {return true;}
			
			return (L1.text != L2.text) || 
			       (L1.fontSize != L2.fontSize);
		},

		removeTween: function() {
			this.edgeTween = null;
		},
		
		makeCurve: function() {
			var cv = new CurveTween.Curve();
			var ls = this.splineList;
			var len = ls.length;
			
			for (var i = 0;i < len;i++) {
				var spl = ls[i];
				for (var j = 0;j < spl.length;j++) {
					var pt = spl[j];
					cv.add(pt);
				}
			}
			
			return cv;
		},
		
		tweenLabel: function(t, moveTweenFunc) {
			var el = this.elements.label;
			var refLabel = this.label; 
			if (this.labelTween.type == ET_MOVE && t < 0.5) {
				refLabel = this.labelTween.ref;
			}

			if (this.labelTween.type == ET_MOVE && t >= 0.5 && this.labelTween.phase == 0) {
				el.firstChild.nodeValue = this.label ? this.label.text : ' ';
				JSViz.GraphNodeRenderer.setEdgeLabelStyle(el, this.label);
				this.labelTween.phase = 1;
			}
			
			if (el && refLabel) {
				if (this.labelTween.willChange || this.labelTween.type == ET_DISAPPEAR) {
					var alpha = (t-0.5) * 2.0;
					if (this.labelTween.type == ET_MOVE) {
						if (alpha < 0) { alpha = -alpha; }
					} else if (this.labelTween.type == ET_DISAPPEAR) {
						alpha = 1.0 - alpha;
					}
					
					if (alpha<0){alpha=0;}
					else if (alpha>1){alpha=1;}
					
					el.style.opacity = JSViz.validateAlpha(alpha);
				}
				
				
				if (this.label) {
					var sx2 = this.label.x;
					var sy2 = this.label.y + JSViz.GraphNodeRenderer.fontYPosition(this.label.fontSize);
					if (this.labelTween.type == ET_MOVE && this.labelTween.ref) {
						var sx1 = this.labelTween.ref.x;
						var sy1 = this.labelTween.ref.y + JSViz.GraphNodeRenderer.fontYPosition(this.labelTween.ref.fontSize);
						var mT = moveTweenFunc ? moveTweenFunc(t) : t;
						this.label.sx = sx1*(1-mT) + sx2*mT;
						this.label.sy = sy1*(1-mT) + sy2*mT;
					} else {
						this.label.sx = sx2;
						this.label.sy = sy2;
					}
				}
			}
		},
		
		
		applyAnimatedEdge: function() {
			var es = this.elements;
			es.curve.setAttribute('d', this.animatedCurve.makePathData(JSViz.GraphNodeRenderer.scale));

			JSViz.GraphNodeRenderer.updateArrowPolygon(es.arrowHeadContainer, es.arrowHeadPolygon, this, true);

			// alpha
			es.container.setAttribute('style', 'opacity:'+validateAlpha(this.animatedCurve.alpha));
		},
		
		firstPoint: function() {
			return this.splineList[0][0];
		},
		
		lastPoint: function() {
			var spl = this.splineList[this.splineList.length - 1];
			return spl[ spl.length - 1 ];
		},
	
		makeName: function() {
			return this.nodeFrom.name +':'+ this.nodeTo.name;
		},
	
		readSplines: function(list) {
			var len = list.length - 2;
			var i, k, y;
			var n = 0;
			var spl;
			var splineList = [];

			this.eflag = list[len];
			this.pen = list[len-1];
			for (i = 0;i < len;i++) {
				k = list[i];

				if (n == 0) {
					if (spl) {
						splineList.push(spl);
						spl = null;
					}

					n = k;
					spl = [];
				} else {
					// read a point (x, y)
					y = list[++i];
					spl.push( new GVPoint(k, y) );
					--n;
				}
			}

			this.splineList = splineList;
			// console.log(this.splineList)
		},

		calcArrowVector: function(useAnimatedCurve) {
			var splines = this.splineList;
			var spl = splines[splines.length - 1];
			var ep, ep2;

			if (this.animatedCurve && useAnimatedCurve) {
				var clen = this.animatedCurve.length();
				ep  = this.animatedCurve.points[clen - 1];
				ep2 = this.animatedCurve.points[clen - 2];
			} else {
				ep  = spl[spl.length - 1];
				ep2 = spl[spl.length - 2];
			}

			return {
				ox: ep.x,
				oy: ep.y,
				x: ep.x - ep2.x,
				y: ep.y - ep2.y
			};
		}
	};

	function GVPoint(x, y) {
		this.x = x || 0;
		this.y = y || 0;
	}


	function Vec2(x, y) {
		this.x = x || 0;
		this.y = y || 0;
	}

	Vec2.prototype = {
		copy: function() {
			return new Vec2(this.x, this.y);
		},

		norm: function() {
			return Math.sqrt(this.x*this.x + this.y*this.y);
		},

		normalize: function() {
			var len = Math.sqrt(this.x*this.x + this.y*this.y);
			if (len > -0.00001 && len < 0.00001) {len=1;}
			this.x /= len;
			this.y /= len;
			return this;
		},

		smul: function(v) {
			this.x *= v;
			this.y *= v;
			return this;
		},

		turnLeft: function() {
			var x = this.x;

			this.x = this.y;
			this.y = -x;
			return this;
		}
	};

	function instantiateTweenSchedule() {
		if (window.JSViz.GraphTweenAnimation && window.JSViz.GraphTweenAnimation.TweenSchedule) {
			return new window.JSViz.GraphTweenAnimation.TweenSchedule();
		}

		return null; // module not loaded
	}

	GVEdge.ET_EMERGE = ET_EMERGE;
	GVEdge.ET_MOVE = ET_MOVE;
	GVEdge.ET_DISAPPEAR = ET_DISAPPEAR;

	function makeHex(v) {
		if (v < 16) { return '0' + v.toString(16); }
		return v.toString(16);
	}
	
	pkg.utf8bytesToString = function(bytes) {
		var chars = [];
		var len = bytes.length;
		for (var i = 0;i < len;i++) {
			chars.push("%"+ makeHex(bytes[i]) );
		}
		
		return unescape(chars.join(''));
	}

	function validateAlpha(a) {
		return (a < 0.001) ? 0 : 
		       (a > 0.999) ? 1 : 
		        a;
	}

	pkg.Vec2 = Vec2;
	pkg.GVEdge = GVEdge;
	pkg.GraphExtractor = GraphExtractor;
	pkg.validateAlpha = validateAlpha;
})(window.JSViz);

// - - - - - - - - -

