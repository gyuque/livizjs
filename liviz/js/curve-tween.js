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

if (!window.CurveTween) { window.CurveTween={}; }

(function(pkg) {
	pkg.Curve = function() {
		this.points = [];
		this.dividedCurve = null;
		this.alpha = 1;
	};
	
	pkg.Curve.prototype = {
		clear: function() {
			this.alpha = 1;
			this.points.length = 0;
		},

		clearDivided: function() {
			this.dividedCurve = null;
		},

		translate: function(dx, dy) {
			for (var i in this.points) {
				this.points[i].x += dx;
				this.points[i].y += dy;
			}

			return this;
		},
		
		subdivide: function(nSegments) {
			var oldCurve = null;
			var newCurve = this;
			var oldT = 0;

			var orgSegs = calcSegments( this.length() );
			for (var i = 0;i < (nSegments-orgSegs);i++) {
				oldCurve = newCurve;
				newCurve = new pkg.Curve();
				var t  = (1.0 / nSegments) * (i+1);

				var oldLength = i*3;
				for (var j = 0;j < oldLength;j++) {
					newCurve.add( oldCurve.points[j] );
				}

				var divPt     = oldCurve.pointAt(i, (t - oldT) / (1 - oldT));
				var p12 = subPt(divPt.ref1, divPt.ref2, divPt.segT);
				var p43 = subPt(divPt.ref4, divPt.ref3, 1.0 - divPt.segT);
				var p23 = subPt(divPt.ref2, divPt.ref3, divPt.segT);

				var pM1 = subPt(p12, p23, divPt.segT);
				var pM2 = subPt(p23, p43, divPt.segT);

				newCurve.add(divPt.ref1);
				newCurve.add(p12);
				newCurve.add(pM1);
				newCurve.add(divPt);
				newCurve.add(pM2);
				newCurve.add(p43);
				newCurve.add(divPt.ref4);

				oldT = t;
	/*
		 document.getElementById('svg1').appendChild(debugDot(p12.x, p12.y));
		 document.getElementById('svg1').appendChild(debugDot(p43.x, p43.y));
		 document.getElementById('svg1').appendChild(debugDot(p23.x, p23.y));
		 document.getElementById('svg1').appendChild(debugDot(pM1.x, pM1.y));
		 document.getElementById('svg1').appendChild(debugDot(pM2.x, pM2.y));

*/
//		 document.getElementById('svg1').appendChild(debugDot(divPt.x, divPt.y, i));
//		 document.getElementById('svg1').appendChild(debugVector(divPt.x, divPt.y, divPt.dx, divPt.dy));
			}

			if (orgSegs > 1) {
				for (i = 4;i < this.points.length;i++) {
					newCurve.add(this.points[i]);
				}
			}

//console.log('>> ' + newCurve.length())
			this.dividedCurve = newCurve;
			return newCurve;
		},
		
		pointAt: function(segIndex, seg_t) {
			var segs = calcSegments( this.length() );
			
			var firstIndex = segIndex * 3;
			
//			console.log(segIndex, seg_t);
			var p1 = this.points[firstIndex  ];
			var p2 = this.points[firstIndex+1];
			var p3 = this.points[firstIndex+2];
			var p4 = this.points[firstIndex+3];

			var pt = {
				x: qbz(p1.x, p2.x, p3.x, p4.x, seg_t),
				y: qbz(p1.y, p2.y, p3.y, p4.y, seg_t),
				dx: qbz_dt(p1.x, p2.x, p3.x, p4.x, seg_t),
				dy: qbz_dt(p1.y, p2.y, p3.y, p4.y, seg_t),
				ref1: p1,
				ref2: p2,
				ref3: p3,
				ref4: p4,
				segT: seg_t
			};
			
			return pt;
		},
		
		debugOut: function(container) {
			var path = $svg('path');
			var len = this.length();
			var d = [];
			for (var i = 0;i < len;i++) {
				var pt = this.points[i];
				if (i == 0) {
					d.push('M');
				} else if (i == 1) {
					d.push('C');
				}
				
				d.push(pt.x+','+pt.y);
				container.appendChild( debugDot(pt.x, pt.y, (i%3) == 0, i==5) );
			}
			
			path.setAttribute('d', d.join(' '));
			path.setAttribute('fill', 'none');
			path.setAttribute('stroke', 'lime');
			container.appendChild(path);
		},
		
		makePathData: function(scale) {
			var len = this.length();
			var d = [];
			scale = scale || 1;
			
			for (var i = 0;i < len;i++) {
				var pt = this.points[i];
				if (i == 0) {
					d.push('M');
				} else if (i == 1) {
					d.push('C');
				}
				
				d.push((pt.x*scale)+','+(pt.y*scale));
			}
			
			return d.join(' ');
		},
		
		length: function() {
			return this.points.length;
		},
		
		add: function(x, y) {
			if (y === undefined) {
				y = x.y;
				x = x.x;
			}

			this.points.push({
				x: x,
				y: y
			});
			
			return this;
		}
	};

	function FadeOutTweenContext(cv) {
		this.cv = cv;
	}

	FadeOutTweenContext.prototype = {
		interpolate: function(cvOut, t) {
			cvOut.clear();

			var len  = this.cv.length();
			for (var i = 0;i < len;i++) {
				var x = this.cv.points[i].x;
				var y = this.cv.points[i].y;
				cvOut.add(x, y);
			}

			cvOut.alpha = 1.0 - t;
		}
	};


	function TweenContext(cvFrom, cvTo, growAnim) {
		this.cvFrom = cvFrom;
		this.cvTo = cvTo;
		this.growAnim = growAnim;
	}

	TweenContext.prototype = {
		interpolate: function(cvOut, t) {
			cvOut.clear();
			var _t = 1.0 - t;
			var tt = t*t;
			var _tt = 1.0 - tt;
			
			if (this.growAnim) {
				growCurve(cvOut, this.cvTo, (t<0.1) ? 0.1 : t);
				return;
			}

			var len  = this.cvFrom.length();
			for (var i = 0;i < len;i++) {
				//if (i == 0 || i == (len-1)) {
					cvOut.add(
						this.cvFrom.points[i].x * _t + this.cvTo.points[i].x * t,
						this.cvFrom.points[i].y * _t + this.cvTo.points[i].y * t
					);
					/*
				}
				else {
					cvOut.add(
						this.cvFrom.points[i].x * _tt + this.cvTo.points[i].x * tt,
						this.cvFrom.points[i].y * _tt + this.cvTo.points[i].y * tt
					);
				}*/
			}
		},

		growAnimation: function(t) {
			if (t<0){t=0;}

			var slen = calcSegments( this.cvTo.length() );
			var k = t * slen;
			var segIndex = Math.floor(k);
			var segT = k - segIndex;
			if (segIndex == slen) {
				--segIndex;
				segT = 1.0;
			}

			return this.cvTo.pointAt(segIndex, segT);
		}

	};

	function debugDot(x, y, clr, larger) {
		var c = $svg('circle');
		c.setAttribute('cx', x);
		c.setAttribute('cy', y);
		c.setAttribute('r', larger ? 3 : 2);
		c.setAttribute('fill', clr ? 'yellow' : 'white');

		return c;
	}

	function debugVector(x, y, dx, dy) {
		var c = $svg('line');
		c.setAttribute('x1', x);
		c.setAttribute('y1', y);
		c.setAttribute('x2', x+dx);
		c.setAttribute('y2', y+dy);
		c.setAttribute('stroke', 'red');

		return c;
	}
	
	function qbz(p1, p2, p3, p4, t) {
		var _t = 1.0 - t;
		return _t*_t*_t * p1 +
		       _t*_t* t * 3.0 * p2 +
		       _t* t* t * 3.0 * p3 + 
		        t* t* t * p4;
	}

	function qbz_dt(p1, p2, p3, p4, t) {
		var _t = 1.0 - t;
		return -3.0 * _t*_t * p1 +
		       (9.0*t*t - 12.0*t + 3) * p2 +
		       (-9.0*t*t + 6.0*t) * p3 + 
		       3.0 * t*t * p4;
	}

	function subPt(p0, p1, kmul) {
		return {
			x: (p1.x - p0.x) * kmul + p0.x,
			y: (p1.y - p0.y) * kmul + p0.y
		};
	}
	
	function createStraight(p1, p2, scale, translate) {
		var cv = new pkg.Curve();
		
		cv.add(p1);
		cv.add(subPt(p1, p2, 0.333*scale));
		cv.add(subPt(p1, p2, 0.667*scale));
		cv.add(subPt(p1, p2, scale));

		if (translate) {
//			cv.points[0].x += translate.x;
//			cv.points[0].y += translate.y;
			cv.translate(translate.x, translate.y);
		}
		
		return cv;
	}

	function createFadeOutTween(cv) {
		return new FadeOutTweenContext(cv);
	}
	
	function createTween(c1, c2, growAnim) {
		c1.clearDivided();
		c2.clearDivided();

		var longer = 1;
		var shouldDivided = null;
		var l2 = c2.length();
		var maxLen = c1.length();
		if (maxLen < l2) {
			longer = 2;
			maxLen = l2;
		}
		
		var maxSegments = calcSegments(maxLen);

		if (c1.length() != l2) {
			shouldDivided = (longer == 1) ? c2 : c1;
			shouldDivided.subdivide(maxSegments);
			// shouldDivided.dividedCurve.translate(240,0).debugOut(document.getElementById('svg1'));
		}

		var cvFrom = c1.dividedCurve || c1;
		var cvTo = c2.dividedCurve || c2;

		return new TweenContext(cvFrom, cvTo, growAnim);
	}
	
	
	function growCurve(cvOut, cvIn, t) {
		// calc segment index
		var slen = calcSegments( cvIn.length() );
		var k = t * slen;
		var i;
		var segIndex = Math.floor(k);
		var segT = k - segIndex;
		if (segIndex == slen) {
			--segIndex;
			segT = 1.0;
		}

		// copy grown segments
		cvOut.clear();
		if (segIndex > 0) {
			var copyLen = 3 * segIndex;
			for (i = 0;i < copyLen;i++) {
				cvOut.add(cvIn.points[i]);
			}
		}

		var vec = {x:0, y:0};
		var ancI1;
		ancI1 = segIndex * 3;
		cvOut.add(cvIn.points[ancI1]);
		if (segT < 0.001) {
			return;
		}
		
		growHandle(vec, cvIn, ancI1, 0);
		vec.x *= segT;
		vec.y *= segT;
		cvOut.add(cvIn.points[ancI1].x + vec.x,  cvIn.points[ancI1].y + vec.y);

		var headPt = cvIn.pointAt(segIndex, segT);
		growHandle(vec, cvIn, ancI1, segT);
		vec.x *= segT;
		vec.y *= segT;

		cvOut.add(headPt.x + vec.x, headPt.y + vec.y);
		cvOut.add(headPt);
	}
	
	function assertNaN(cv) {
		var len = cv.length();
		for (var i = 0;i < len;i++) {
			var pt = cv.points[i];
			if (isNaN(pt.x) || isNaN(pt.y)) {
				console.log(this);
				throw "Bad NaN";
			}
		}
	}

	function growHandle(outVec, cv, index, t) {
		var tail = t < 0.0001;
		var pts = cv.points;
		var dx = qbz_dt(pts[index].x, pts[index+1].x, pts[index+2].x, pts[index+3].x, t);
		var dy = qbz_dt(pts[index].y, pts[index+1].y, pts[index+2].y, pts[index+3].y, t);
		var len = vecLen(dx, dy);
		if (len < 0.0001 && len > -0.0001) {len=1;}
		
		dx /= len;
		dy /= len;
		
		var handleI1 = tail ? index     : (index+3);
		var handleI2 = tail ? (index+1) : (index+2);
		var h1 = pts[handleI1];
		var h2 = pts[handleI2];
		var hlen = vecLen(h1.x-h2.x, h1.y-h2.y);
	
		if (tail) {
			outVec.x = dx * hlen;
			outVec.y = dy * hlen;
		} else {
			outVec.x = -dx * hlen;
			outVec.y = -dy * hlen;
		}
	}

	
	function vecLen(x,y) {return Math.sqrt(x*x + y*y);}
	
	function calcSegments(plen) {
		return ((plen-1) / 3) | 0;
	}

	function $svg(name) {
		return document.createElementNS("http://www.w3.org/2000/svg", name);
	}

	pkg.createStraight = createStraight;
	pkg.createTween = createTween;
	pkg.createFadeOutTween = createFadeOutTween;
	pkg.growCurve = growCurve;
})(CurveTween);