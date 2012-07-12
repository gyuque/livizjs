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
	
	function GraphsController(renderAreaId) {
		this.glog = [];
		this.renderAreaId = renderAreaId;
		this.renderer = new JSViz.GraphRenderer(document.getElementById(this.renderAreaId), 640, 400);
		this.graphTween = new GraphTweenAnimation(this.renderer);
		this.animationManager = new AnimationManager(this.graphTween);
	}
	
	GraphsController.prototype = {
		setNewGraph: function(g, slowMode, finishHandler) {
			this.animationManager.finishHandler = finishHandler;
			this.animationManager.forceFinish();
			this.animationManager.changeSlow(slowMode ? 3 : 1);
		
			this.glog.push(g);
			var prev = this.getPrevGraph();
			this.cleanRemovedElements(prev);

			this.graphTween.setPair(prev, g);
			this.animationManager.start();
		},
		
		cleanRemovedElements: function(referGraph) {
			if (!referGraph) {
				return;
			}
			
			for (var nodeName in this.renderer.nodeNameMap) {
				if (!referGraph.nodeNameMap[nodeName]) {
					this.renderer.removeNode(nodeName);
				}
			}

			for (var edgeName in this.renderer.edgeNameMap) {
				if (!referGraph.edgeNameMap[edgeName]) {
					this.renderer.removeEdge(edgeName);
				}
			}
			
		},

		setDisplayGraphSize: function(g, w, h) {
			g.screenSize.w = w / this.renderer.scaleToDisplayDPI() + 4;
			g.screenSize.h = h / this.renderer.scaleToDisplayDPI() + 16;
		},
		
		getPrevGraph: function() {
			if (this.glog.length > 1) {
				return this.glog[this.glog.length - 2];
			}
			
			return null;
		}
	};
	
	// + + + + Renderer + + + +
	function GraphRenderer(svg, vw, vh) {
		this.scale = 80.0;
		this.marginTop = 40;
		this.viewportSize = {w: vw, h: vh};
		this.svgElement = svg;
		this.containerElement = $svg('g');
		this.defsElement = $svg('defs');
		this.filterElements = [];
		this.nodeNameMap = {__proto__:null};
		this.edgeNameMap = {__proto__:null};

		svg.appendChild(this.containerElement);
		this.setMetrics(svg);

		svg.appendChild(this.defsElement);
		this.setupFilters(this.defsElement, this.filterElements);
	}

	GraphRenderer.makeFilterId = function(i){return "blurf-"+i;}
	GraphRenderer.PEN_DASHED = 1;

	GraphRenderer.prototype = {
		setupFilters: function(defs, filterList) {
			var len = 20;
			for (var i = 0;i < len;i++) {
				var f = $svg('filter');
				var blur = $svg('feGaussianBlur');
				blur.setAttribute('in', 'SourceGraphic');
				blur.setAttribute('stdDeviation', (i+1)*0.25);
				f.setAttribute('id', GraphRenderer.makeFilterId(i));
				filterList.push(f);
				f.appendChild(blur);
				defs.appendChild(f);
			}
		},
		
		applyBlurFilter: function(el, t) {
			var fid = '';
			if (t > 0.01) {
				var len = this.filterElements.length;
				var i = Math.floor(t * len);
				if (i < 0) {i=0;}
				if (i >= len) {i=(len-1);}
				
				fid = 'url(#'+ GraphRenderer.makeFilterId(i) +')';
			}
		
			el.setAttribute('filter', fid);
		},
	
		setViewportWidth: function(w) {
			this.viewportSize.w = w;
			this.setMetrics(this.svgElement);
		},

		setViewportHeight: function(h) {
			this.viewportSize.h = h;
			this.setMetrics(this.svgElement);
		},
	
		setMetrics: function(element) {
			var ww = this.viewportSize.w >> 1;
			var h  = this.viewportSize.h;
			
			element.setAttribute('viewBox', [-ww, 0, this.viewportSize.w, h].join(' '));
			element.style.width  = this.viewportSize.w + 'px';
			element.style.height = h + 'px';
			element.style.marginTop = this.marginTop + 'px';
		},
	
		scaleToDisplayDPI: function() {
			return 72.0 / this.scale;
		},

		updateView: function(g, prevGraph) {
			GraphNodeRenderer.scale = this.scale;
			GraphNodeRenderer.relScale = this.scaleToDisplayDPI();
			// this.clear();

			g.element = this.containerElement;
			this.positionGraph(g, prevGraph);
			this.renderNodes(g);
			this.renderEdges(g);
		},

		clear: function() {
		throw "XXX";
			var ls = this.containerElement.childNodes;
			var len = ls.length;
			for (var i = (len-1);i >= 0;--i) {
				this.containerElement.removeChild(ls[i]);
			}
		},
		
		removeNode: function(nodeName) {
			var nd = this.nodeNameMap[nodeName];
			if (nd) {
				if (nd.element) {
					this.containerElement.removeChild(nd.element);
				}
				delete this.nodeNameMap[nodeName];
			}
		},

		removeEdge: function(edgeName) {
			var edge = this.edgeNameMap[ edgeName ];
			if (edge) {
				this.containerElement.removeChild(edge.elements.label);
				this.containerElement.removeChild(edge.elements.container);
				delete this.edgeNameMap[ edgeName ];
			}
		},

		positionGraph: function(g, prevGraph) {
			g.animatedPosition.x = g.screenPosition.x = Math.floor(-g.screenSize.w/2);
			g.animatedPosition.y = g.screenPosition.y = 8;
			g.nonscaledPosition.x = g.screenPosition.x / this.scale;
			g.nonscaledPosition.y = g.screenPosition.y / this.scale;

			if (!prevGraph) {
				GraphNodeRenderer.applyGraphPosition(g);
			}
		},

		renderEllipseNodeSVG: function(nd) {
			var hw = Math.floor(nd.w*this.scale + 0.5) >> 1;
			var hh = Math.floor(nd.h*this.scale + 0.5) >> 1;
			var el = $svg('ellipse');
			el.setAttribute('cx', nd.x*this.scale);
			el.setAttribute('cy', nd.y*this.scale);
			
			el.setAttribute('rx', hw);
			el.setAttribute('ry', hh);
			el.setAttribute('fill', 'red');

			return el;
		},

		renderNodes: function(g) {
			var nd;
			for (var i in g.nodeMap) {
				nd = g.nodeMap[i];
				if (!this.isNodeDrawn(nd)) {
					this.renderANode(nd);
					this.nodeNameMap[nd.name] = nd;
				} else {
					// set existing element
					nd.element = this.nodeNameMap[nd.name].element;
					GraphNodeRenderer.updateNodeStyle(this.nodeNameMap[nd.name], nd);
				}
			}
		},

		renderEdges: function(g) {
			var nd;
			for (var i in g.nodeMap) {
				nd = g.nodeMap[i];
				if (nd.outgoingEdges) {
					for (var j in nd.outgoingEdges) {
						var edge = nd.outgoingEdges[j];
						if (!this.isEdgeDrawn(edge)) {
							this.edgeNameMap[ edge.makeName() ] = edge;
							edge.elements = this.renderAEdge(edge);
							GraphNodeRenderer.setEmergingEdgeInitialStyle(edge.elements.container, edge.elements.label);
						} else {
							var existingEdge = this.edgeNameMap[ edge.makeName() ];
							edge.elements = existingEdge.elements;
							GraphNodeRenderer.updateEdgeStyle(existingEdge, edge);
						}
					}
				}
			}
		},
		
		isNodeDrawn: function(nd) {
			return !!(this.nodeNameMap[nd.name]);
		},

		isEdgeDrawn: function(edge) {
			return !!(this.edgeNameMap[ edge.makeName() ]);
		},

		renderANode: function(nd) {
			var ndElem = GraphNodeRenderer.renderNode(nd);
			nd.element = ndElem;
			this.containerElement.appendChild(ndElem);
		},

		renderAEdge: function(edge) {

			var sps = edge.splineList;
			var crv = $svg('path');
			var container = $svg('g');
			var retElements = {curve: crv, container: container, arrowShape: null, label: null};
			// crv.setAttribute('d', this.makePath(edge.nodeFrom, edge.nodeTo, sps));
			crv.setAttribute('fill', 'none');
			crv.setAttribute('stroke-width', '1');
			GraphNodeRenderer.setEdgeStrokeStyle(crv, edge);
			
			container.appendChild(crv);

			var asvg = this.renderArrawHead(edge, retElements, 
			                                GraphNodeRenderer.getEdgeStrokeColor(edge));
			retElements.arrowShape = asvg.firstChild; // XXX
			GraphNodeRenderer.setEdgeArrowStyle(retElements.arrowShape, edge);
			
			container.appendChild(asvg);
			this.containerElement.appendChild(container);

			retElements.label = $svg('text');
			retElements.label.appendChild( document.createTextNode(' ') );
			if (edge.label) {
				retElements.label.firstChild.nodeValue = edge.label.text;
				GraphNodeRenderer.setEdgeLabelStyle(retElements.label, edge.label);
			}
			this.containerElement.appendChild(retElements.label);
			GraphNodeRenderer.applyDefaultLabelStyle(retElements.label);
/*
			for (var i in sps) {
				var spl = sps[i];
				for (var j = 0;j < spl.length;j++) {
					var box = $svg('circle');
					box.setAttribute('cx', spl[j].x*this.scale);
					box.setAttribute('cy', spl[j].y*this.scale);
					box.setAttribute('r', 2);
					box.setAttribute('fill', 'blue');
					this.containerElement.appendChild(box);
				}
			}
*/
			return retElements;
		},

		renderArrawHead: function(edge, retElements) {
			var pg = $svg('polygon');
			var ag = $svg('g');

			ag.appendChild(pg);
			retElements.arrowHeadContainer = ag;
			retElements.arrowHeadPolygon   = pg;

			GraphNodeRenderer.updateArrowPolygon(ag, pg, edge);

			return ag;
		},

		makePath: function(n1, n2, splines) {
			var S = this.scale;
			var d = [];
			var len = splines.length;
			var j;
			for (var i = 0;i < len;i++) {
				var spl = splines[i];
				if (!i) {
					d.push('M');
					d.push(spl[0].x *S); d.push(spl[0].y *S);
					d.push('C');
				} else {
					d.push(spl[0].x *S); d.push(spl[0].y *S);
				}
/*
				d.push(!i ? 'M' : 'L');
				d.push(spl[0].x *S); d.push(spl[0].y *S);
				d.push('C');
*/
				for (j = 1;j < spl.length;j++) {
					d.push(spl[j].x *S);
					d.push(spl[j].y *S);
				}
			}

			return d.join(' ');
		}
	};





	function $svg(name) {
		return document.createElementNS("http://www.w3.org/2000/svg", name);
	}

	function $H(name) {
		return document.createElementNS("http://www.w3.org/1999/xhtml", name);
	}

	var GraphNodeRenderer = {
		CHECK_PROPS: [
			'fontSize',
			'nPeripheries',
			'nSides',
			'penWidth',
			'w', 'h'
		],
	
		scale: 1,
		relScale: 1,
		renderNode: function(nd, existingContainer) {
			var nodeContainer = existingContainer || $svg('g');
			this.applyNodePosition(nodeContainer, nd);
			
			var shp = this.renderShape(nd);
			nodeContainer.appendChild(shp);
			
			var lab = this.renderLabel(nd);
			nodeContainer.appendChild(lab);
			
			if (!existingContainer) {
				this.setEmergingNodeInitialStyle(nodeContainer);
			}
			return nodeContainer;
		},
		
		updateNodeStyle: function(existingNode, newNode) {
			var propNames = GraphNodeRenderer.CHECK_PROPS;
			var anyChanged = false;
			
			for (var i in propNames) {
				var p = propNames[i];
				if (existingNode[p] !== newNode[p]) {
					anyChanged = true;
					existingNode[p] = newNode[p];
				}
			}
			
			if (anyChanged) {
				clearChildren(existingNode.element);
				GraphNodeRenderer.renderNode(existingNode, existingNode.element);
			}
		},
		
		applyNodePosition: function(elem, nd) {
			elem.setAttribute(
				'transform',
				this.translate(nd.sx*this.scale, nd.sy*this.scale)
			);
		},
		
		applyEdgeLabelPosition: function(edge) {
			var S = this.relScale;
			var el = edge.elements.label;
			if (edge.label) {
				el.setAttribute('x', (edge.label.sx /S) >> 0);
				el.setAttribute('y', (edge.label.sy /S) >> 0);
			}
		},
		
		renderShape: function(nd) {
			var hw = Math.floor(nd.w*this.scale + 0.5) >> 1;
			var hh = Math.floor(nd.h*this.scale + 0.5) >> 1;
			if (nd.nPeripheries < 1) {
				return this.renderNullShape(nd, hw, hh);
			}
			if (nd.nSides <= 2)
				return this.renderEllipseShape(nd, hw, hh);
			else
				return this.renderRectShape(nd, hw, hh);
		},

		renderNullShape: function(nd, hWidth, hHeight) {
			var el = $svg('g');
			return el;
		},
		
		renderEllipseShape: function(nd, hWidth, hHeight) {
			var el = $svg('ellipse');
//			el.setAttribute('cx', nd.x*this.scale);
//			el.setAttribute('cy', nd.y*this.scale);
			
			el.setAttribute('rx', hWidth);
			el.setAttribute('ry', hHeight);
//			el.setAttribute('fill', 'red');
			el.setAttribute('fill', 'none');
			el.setAttribute('stroke', 'black');
			el.setAttribute('stroke-width', Math.floor(nd.penWidth));
			
			return el;
		},

		renderRectShape: function(nd, hWidth, hHeight) {
			var el = $svg('rect');
			
			el.setAttribute('x', -hWidth);
			el.setAttribute('y', -hHeight);
			el.setAttribute('width',  hWidth*2);
			el.setAttribute('height', hHeight*2);
			el.setAttribute('fill', 'none');
			el.setAttribute('stroke', 'black');
			el.setAttribute('stroke-width', Math.floor(nd.penWidth));
			
			return el;
		},
		
		renderLabel: function(nd) {
			var tx = $svg('text');
			tx.setAttribute('font-size', nd.fontSize);
			tx.setAttribute('font-family', 'Arial');
			tx.setAttribute('text-anchor', 'middle');
			GraphNodeRenderer.applyDefaultLabelStyle(tx);
			tx.appendChild( document.createTextNode(nd.name) );
			tx.setAttribute('y', GraphNodeRenderer.fontYPosition(nd.fontSize));
			
			return tx;
		},
		
		applyDefaultLabelStyle: function(el) {
			el.setAttribute('font-family', 'Arial');
			el.setAttribute('text-anchor', 'middle');
		},
		
		fontYPosition: function(fontSize) {
			return (fontSize / 3) | 0;
		},

		updateEdgeStyle: function(existingEdge, newEdge) {
			var anyChanged = false;
			if (existingEdge.eflag !== newEdge.eflag) {
				existingEdge.eflag = newEdge.eflag;
				anyChanged = true;
			}

			if (existingEdge.penColor !== newEdge.penColor) {
				existingEdge.penColor = newEdge.penColor;
				anyChanged = true;
			}

			if (existingEdge.pen !== newEdge.pen) {
				existingEdge.pen = newEdge.pen;
				anyChanged = true;
			}
			
			if (anyChanged) {
				GraphNodeRenderer.setEdgeStrokeStyle(existingEdge.elements.curve, existingEdge);
				GraphNodeRenderer.setEdgeArrowStyle(existingEdge.elements.arrowShape, existingEdge);
			}
		},
		
		setEdgeStrokeStyle: function(strokeElement, edgeData) {
			strokeElement.setAttribute('stroke', 
			                           GraphNodeRenderer.getEdgeStrokeColor(edgeData));
			
			if (GraphRenderer.PEN_DASHED == edgeData.pen) {
				strokeElement.setAttribute('stroke-dasharray', '3,3');
			}
		},

		setEdgeArrowStyle: function(arrowShapeElement, edgeData) {
			arrowShapeElement.setAttribute('fill',
			                               GraphNodeRenderer.getEdgeStrokeColor(edgeData));
		},
		
		setEdgeLabelStyle: function(labelElement, labelData) {
			if (labelData) {
				labelElement.setAttribute('font-size', labelData.fontSize);
			}
		},

		getEdgeStrokeColor: function(edgeData) {
			return (edgeData.penColor == 'transparent') ? 'none' : 'black';
		},

		updateArrowPolygon: function(container, pg, edge, useAnimatedCurve) {
			if (edge.eflag) {
				var avec = edge.calcArrowVector(useAnimatedCurve);
				var ev = (new JSViz.Vec2(avec.x, avec.y)).normalize().smul( edge.arrowVector.norm() );
				// ev.smul(this.scale);

				var sideVector = ev.copy().turnLeft().smul(0.35);
				this.applyNodePosition(container, {sx: avec.ox, sy: avec.oy});

				var points = [];
				points.push('0,0');
				points.push(sideVector.x +','+sideVector.y);
				points.push(ev.x +','+ ev.y);
				points.push((-sideVector.x) +','+ (-sideVector.y));

				pg.setAttribute('points', points.join(' '));
			} else {
				pg.setAttribute('points', '');
			}
		},
		
		translate: function(x, y) {
			return 'translate('+x+','+y+')';
		},
		
		setEmergingNodeInitialStyle: function(element) {
			element.style.opacity = 0;
		},

		setEmergingEdgeInitialStyle: function(element, labelElement) {
			element.style.opacity = 0;
			labelElement.style.opacity = 0;
		},

		applyGraphPosition: function(g) {
			g.element.setAttribute('transform', this.translate(g.animatedPosition.x, g.animatedPosition.y) );
		}
	};
	
	
	// >>> Animation <<<
	function AnimationManager(ao, finishHandler) {
		this.finishHandler = finishHandler;
		this.animationObject = ao;
		this.defaultDivs = 220;
		this.slowScale = 1;
		this.defaultInterval = 10;
		this.frameCount = this.defaultDivs;
		this.prevTime = 0;
		
		var _this = this;
		this.closure = function(){ _this.tick(); } ;
	}
	
	AnimationManager.prototype = {
		currentTime: function() {
			return (new Date()) - 0;
		},
	
		tick: function() {
			if (!this.animationObject || this.frameCount >= this.defaultDivs) {
				return false;
			}
			
			++this.frameCount;
			
			// frame skip
			var curT  = this.currentTime();
			var diffT = curT - this.prevTime;
			this.prevTime = curT;
			if (diffT > (this.defaultInterval*2)) {++this.frameCount;}
			if (diffT > (this.defaultInterval*3)) {++this.frameCount;}
			
			var t = this.frameCount / this.defaultDivs;
			
			this.animationObject.showFrame(t);
			if (t < 0.999) {
				setTimeout(this.closure, this.defaultInterval);
			} else {
				this.animationObject.finishAnimation();
				if (this.finishHandler) {this.finishHandler();}
			}
		},
		
		start: function() {
			if (this.animationObject.willStart) {
				this.changeDivs(
					this.animationObject.willStart() * this.slowScale
				);
			}
			
			this.prevTime = this.currentTime();
			this.frameCount = 0;
			setTimeout(this.closure, this.defaultInterval);
		},
		
		changeSlow: function(s) {
			this.slowScale = s;
		},
		
		changeDivs: function(d) {
			this.defaultDivs = d;
			this.frameCount  = d;
		},
				
		forceFinish: function() {
			if (this.frameCount < this.defaultDivs) {
				this.animationObject.showFrame(1);
				this.animationObject.finishAnimation();
			}
		}
	};
	
	
	function GraphTweenAnimation(renderer) {
		this.graphRenderer = renderer;
		this.fromGraph = null;
		this.toGraph   = null;
		this.graphTween = null;
	}
	
	GraphTweenAnimation.prototype = {
		setPair: function(g1, g2) {
			this.fromGraph = g1;
			this.toGraph   = g2;
			if (g1 && g2) {
				this.graphTween = new GraphTweenAnimation.GraphMoveTween(g1, g2);
			}
		},
		
		willStart: function() {
			var unNormalizedList = [];
			this.spreadCanvasIf();
			this.graphRenderer.updateView(this.toGraph, this.fromGraph);
		
			var anyEmerge   = false;
			var anyDisappear = false;
			
			var i, nd, edge;
			var emgNodeAddrs = this.makeEmergingNodeList();
			var disNodeAddrs = this.makeDisappearingNodeList();
			
			var emgEdges = this.makeEmergingEdgeList();
			var disEdges = this.makeDisappearingEdgeList();
			
			if (emgNodeAddrs && emgNodeAddrs.length > 0) { anyEmerge = true; }
			if (emgEdges && emgEdges.length > 0) { anyEmerge = true; }
			if (disNodeAddrs && disNodeAddrs.length > 0) { anyDisappear = true; }
			if (disEdges && disEdges.length > 0) { anyDisappear = true; }

			// reset end nodes
			for (i in emgEdges) {
				edge = emgEdges[i];
				edge.nodeFrom.tweenSchedule.reset();
				edge.nodeTo.tweenSchedule.reset();
			}

			// disappearing nodes
			var disEnd = 0;
			for (i in disNodeAddrs) {
				nd = this.fromGraph.nodeByAddress(disNodeAddrs[i]);
				nd.tweenSchedule.reset();
				nd.tweenSchedule.unOffset = (i-0) * 0.5;
				nd.tweenSchedule.unRange  = 4;
				disEnd = nd.tweenSchedule.unOffset + nd.tweenSchedule.unRange;
				unNormalizedList.push(nd);
			}

			for (i in disEdges) {
				if (disEnd < 4){disEnd=4;}
				edge = disEdges[i];
				edge.tweenSchedule.reset();
				edge.tweenSchedule.unOffset = 0;
				edge.tweenSchedule.unRange  = disEnd - 2;
				unNormalizedList.push(edge);
			}

			var moveEnd = 0;
			if (this.graphTween) {
				this.graphTween.tweenSchedule.reset();
				this.graphTween.tweenSchedule.unOffset = disEnd;
				this.graphTween.tweenSchedule.unRange  = 9;
				unNormalizedList.push(this.graphTween);
				
				moveEnd = this.graphTween.tweenSchedule.unOffset + this.graphTween.tweenSchedule.unRange;
			}

			var sortedEmgNodes = null;
			if (emgNodeAddrs && emgNodeAddrs.length > 0) {
				sortedEmgNodes = this.orderEmergingNodes(emgNodeAddrs, this.toGraph);
				for (i in sortedEmgNodes) {
					nd = sortedEmgNodes[i];
					nd.tweenSchedule.reset();
					nd.tweenSchedule.unOffset = moveEnd + nd.emgOrder*1.5;
					nd.tweenSchedule.unRange  = 5;
				}
				
			}
			
			for (i in emgEdges) {
				edge = emgEdges[i];
				edge.tweenSchedule.reset();
				var unof = edge.nodeFrom.tweenSchedule.unOffset + 3;
				if (edge.nodeTo.tweenSchedule.unOffset && unof < edge.nodeTo.tweenSchedule.unOffset) {
					unof = edge.nodeTo.tweenSchedule.unOffset;
				}
				edge.tweenSchedule.unOffset = unof;
				edge.tweenSchedule.unRange  = 7;
				unNormalizedList.push(edge);
			}
			
			return this.normalizeSchedules(sortedEmgNodes, unNormalizedList);
		},
		
		spreadCanvasIf: function() {
			if (this.graphRenderer.viewportSize.h < this.toGraph.screenSize.h) {
				this.graphRenderer.setViewportHeight(Math.round( this.toGraph.screenSize.h ));
			}
		},

		shrinkCanvasIf: function() {
			if (this.graphRenderer.viewportSize.h > this.toGraph.screenSize.h) {
				this.graphRenderer.setViewportHeight(Math.round( this.toGraph.screenSize.h ));
			}
		},
		
		normalizeSchedules: function(objList, objList2) {
			var i, j, o, u, ls;
			var un_max = 1;
			for (j = 0;j < 2;j++) {
				ls = (j==0) ? objList : objList2;
				if(!ls) {continue;}
				for (i in ls) {
					o = ls[i];
					u = o.tweenSchedule.unEndTime();
					if (u > un_max) {un_max=u;}
				}
			}
			
			var scale = un_max;
			for (j = 0;j < 2;j++) {
				ls = (j==0) ? objList : objList2;
				if(!ls) {continue;}
				for (i in ls) {
					o = ls[i];
					o.tweenSchedule.offset = o.tweenSchedule.unOffset / scale;
					o.tweenSchedule.speed  = scale / o.tweenSchedule.unRange;
				}
			}
			
			var minDivs = 100;
			var maxDivs = 250;
			var requireDivs = un_max * 6;
			if (requireDivs < minDivs) {requireDivs = minDivs;}
			else if (requireDivs > maxDivs) {requireDivs = maxDivs;}
			
			return Math.floor(requireDivs);
		},
		
		orderEmergingNodes: function(addrList, ownerGraph) {
			var i;
			var len = addrList.length;
			var sorted = new Array(len);
			for (i = 0;i < len;i++) {
				sorted[i] = ownerGraph.nodeByAddress(addrList[i]);
			}
			
			sorted.sort(cmpNodeY);
			for (i = 0;i < len;i++) {
				sorted[i].emgOrder = i;
			}
			
			return sorted;
		},
	
		showFrame: function(t) {
			if (!this.toGraph) {
				return;
			}
			
			this.tweenGraphPosition(t);

			this.tweenEmergingNodes(t);
			this.tweenEmergingEdges(t);
			
			this.tweenExistingNodes(t);
			this.tweenExistingEdges(t);

			this.tweenDisappearingNodes(t);
			this.tweenDisappearingEdges(t);
		},

		finishAnimation: function() {
			this.graphTween = null;

			var edges = this.toGraph.collectEdges(null, true);
			for (var i in edges) {
				edges[i].removeTween();
			}

			this.shrinkCanvasIf();
		},
		
		tweenGraphPosition: function(t) {
			if (!this.fromGraph) {
				return;
			}

			var m_t = this.graphTween.tweenSchedule.modify(t);
			this.graphTween.interpolate(TweenFuncs.SEaseOut(m_t));
		},
		
		makeEmergingNodeList: function() {
			return this.toGraph.collectNodes(this.fromGraph ? this.fromGraph.nodeNameMap : null, true);
		},
		
		makeEmergingEdgeList: function() {
			return this.toGraph.collectEdges(this.fromGraph ? this.fromGraph.edgeNameMap : null, true);
		},
		
		tweenEmergingNodes: function(t) {
			var emgNodeAddrs = this.makeEmergingNodeList();
			for (var i in emgNodeAddrs) {
				var nd = this.toGraph.nodeByAddress(emgNodeAddrs[i]);
				var m_t = nd.tweenSchedule.modify(t);
				nd.element.style.opacity = JSViz.validateAlpha(m_t);
			}
			
//			console.log('E', emgNodeAddrs)
		},
		
		tweenEmergingEdges: function(t) {
			var emgEdges = this.makeEmergingEdgeList();
			for (var i in emgEdges) {
				var edge = emgEdges[i];
				if (!edge.edgeTween) {
					edge.createEdgeTween(JSViz.GVEdge.ET_EMERGE);
				}

				var m_t = edge.tweenSchedule.modify(t);

				edge.edgeTween.interpolate(edge.animatedCurve, TweenFuncs.SEaseOut(m_t));
				
				var alpha = m_t*1.1 - 0.1;
				if (alpha<0){alpha=0;}
				edge.animatedCurve.alpha = alpha;
				edge.applyAnimatedEdge();

				edge.tweenLabel(m_t);
				GraphNodeRenderer.applyEdgeLabelPosition(edge);
			}
		},
		
		modifyTforMoving: function(t) {
			if (this.graphTween) {
				return this.graphTween.tweenSchedule.modify(t);
			}
			
			return t;
		},
		
		tweenExistingNodes: function(t) {
			if (!this.fromGraph) {
				return;
			}
			
			var m_t = this.modifyTforMoving(t);
			var exsNodeAddrs = this.toGraph.collectNodes(this.fromGraph ? this.fromGraph.nodeNameMap : null, false);
			for (var i in exsNodeAddrs) {
				var nd2 = this.toGraph.nodeByAddress(exsNodeAddrs[i]);
				var nd1 = this.fromGraph.nodeByAddress(
				           this.fromGraph.nodeAddressByName(nd2.name));
				
				this.interpolateNodePosition(nd2, nd1, nd2, m_t, TweenFuncs.SEaseOut);
				GraphNodeRenderer.applyNodePosition(nd2.element, nd2);
			}
		},

		tweenExistingEdges: function(t) {
			if (!this.fromGraph) {
				return;
			}
			
			var m_t = this.modifyTforMoving(t);
			var exsEdges = this.toGraph.collectEdges(this.fromGraph.edgeNameMap, false);
			for (var i in exsEdges) {
				var edge = exsEdges[i];
				if (!edge.edgeTween) {
					edge.createEdgeTween(JSViz.GVEdge.ET_MOVE,
					  this.fromGraph.edgeByName(edge.makeName()) );
				}

				edge.edgeTween.interpolate(edge.animatedCurve, TweenFuncs.SEaseOut(m_t));
				edge.applyAnimatedEdge();

				edge.tweenLabel(m_t, TweenFuncs.SEaseOut);
				GraphNodeRenderer.applyEdgeLabelPosition(edge);
			}
		},

		makeDisappearingNodeList: function() {
			if (!this.fromGraph) { return null; }
			
			return this.fromGraph.collectNodes(this.toGraph.nodeNameMap, true);
		},
		
		tweenDisappearingNodes: function(t) {
			var disNodeAddrs = this.makeDisappearingNodeList();
			if (!disNodeAddrs) { return; }
			
			for (var i in disNodeAddrs) {
				var nd = this.fromGraph.nodeByAddress(disNodeAddrs[i]);
				var m_t = nd.tweenSchedule.modify(t);
				var alpha = 1.0 - m_t;
				nd.element.style.opacity = JSViz.validateAlpha(alpha);
				this.graphRenderer.applyBlurFilter(nd.element, (alpha < 0.01) ? 0 : m_t);
			}
		},

		makeDisappearingEdgeList: function() {
			if (!this.fromGraph) {
				return null;
			}
			
			return this.fromGraph.collectEdges(this.toGraph.edgeNameMap, true);
		},

		tweenDisappearingEdges: function(t) {
			var disEdges = this.makeDisappearingEdgeList();
			if (!disEdges) { return; }
			
			for (var i in disEdges) {
				var edge = disEdges[i];
				if (!edge.edgeTween) {
					edge.createEdgeTween(JSViz.GVEdge.ET_DISAPPEAR, edge);
				}

				var m_t = edge.tweenSchedule.modify(t);
				edge.edgeTween.interpolate(edge.animatedCurve, m_t);
				edge.applyAnimatedEdge();
				
				edge.tweenLabel(m_t);
			}
		},

		interpolateNodePosition: function(ndOut, nd1, nd2, t, twfun) {
			var  tt = twfun(t);
			var _tt = 1.0 - tt;
			
			ndOut.sx = nd1.x * _tt + nd2.x * tt;
			ndOut.sy = nd1.y * _tt + nd2.y * tt;
		}
	};
	
	GraphTweenAnimation.GraphMoveTween = function(g1, g2) {
		this.graphFrom = g1;
		this.graphTo = g2;
		this.tweenSchedule = new GraphTweenAnimation.TweenSchedule();
	};
	
	GraphTweenAnimation.GraphMoveTween.prototype = {
		interpolate: function(t) {
			var p1 = this.graphFrom.screenPosition;
			var p2 = this.graphTo.screenPosition;
			var _t = 1.0 - t;

			var x = p1.x * _t + p2.x * t;
			var y = p1.y * _t + p2.y * t;
			this.graphTo.animatedPosition.x = x;
			this.graphTo.animatedPosition.y = y;
			GraphNodeRenderer.applyGraphPosition(this.graphTo);
		},
		
		isMoved: function() {
			var p1 = this.graphFrom.screenPosition;
			var p2 = this.graphTo.screenPosition;
			var dx = Math.round((p1.x - p2.x) / 2);
			var dy = Math.round((p1.y - p2.y) / 2);
			return dx || dy;
		}
	};

	GraphTweenAnimation.TweenSchedule = function() {
		this.reset();
	};
	
	GraphTweenAnimation.TweenSchedule.prototype = {
		reset: function() {
			this.unOffset = 0;
			this.unRange  = 2;
			this.offset = 0;
			this.speed  = 1;
		},
		
		unEndTime: function() {
			return this.unOffset + this.unRange;
		},
		
		modify: function(t) {
			var u = (t - this.offset) * this.speed;
			if (u < 0){u=0;}
			else if (u > 1) {u=1;}
			
			return u;
		}
	};


	var TweenFuncs = {
		Linear: function(t) {
			if(t<0) { return 0; }
			if(t>1) { return 1; }

			return t;
		},
		
		SEaseOut: function(t) {
			if(t<0) { t = 0; }
			else if(t>1) { t = 1; }

			t = 1.0 - t;
			return 1.0 - t*t;
		}
	};

	function cmpNodeY(a,b){ return ((a.y<<12)+a.x) - ((b.y<<12)+b.x); }

	function clearChildren(el) {
		var ls = el.childNodes;
		var len = ls.length;
		for (var i = (len-1);i >= 0;--i) {
			el.removeChild(ls[i]);
		}
	}


	/* = = = = export = = = = */
	pkg.GraphNodeRenderer = GraphNodeRenderer;
	pkg.GraphTweenAnimation = GraphTweenAnimation;
	pkg.GraphsController = GraphsController;
	pkg.GraphRenderer  = GraphRenderer;
	pkg.createHTMLElement = $H;
})(JSViz);