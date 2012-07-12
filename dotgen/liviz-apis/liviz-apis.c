#include <string.h>
#include "dot.h"
#include "gvc.h"
#include "gvio.h"
#include "graph.h"
#include "utils.h"
#include "liviz-apis.h"

extern int Y_invert;
extern int aglinenumber(void);
extern void init_job_viewport(GVJ_t * job, graph_t * g);
extern void init_job_pagination(GVJ_t * job, graph_t *g);
extern void emit_setup_page(GVJ_t * job, graph_t * g);
extern void emit_firstpage(GVJ_t *job);
extern void emit_firstlayer(GVJ_t *job);
extern pointf make_arrow_vector(pointf p, pointf u, double arrowsize);

static xg_errorFunc externalErrorFunc = NULL;
GVC_t* sVizContext = NULL;

__attribute__((used)) GVC_t* prepareGVContext(int useTestFile) {
	rewind(stdin);
	sVizContext = gvContextPlugins(lt_preloaded_symbols, 0);
	if (useTestFile == 1) {
		sVizContext->input_filenames = N_NEW(2, char *);
		sVizContext->input_filenames[0] = "test.dot";
		sVizContext->input_filenames[1] = NULL;
	} else {
		sVizContext->input_filenames = N_NEW(1, char *);
		sVizContext->input_filenames[0] = NULL;
	}

	gvjobs_output_langname(sVizContext, "dot");
	return sVizContext;
}

/* -- error hook */

static int userErrorFunc(char* msg) {
	if (msg[0] == '|') {
		int lineno = aglinenumber();
		int fatal = (msg[1] == 'W') ? 0 : 1;
		if (NULL != externalErrorFunc) {
			externalErrorFunc(fatal, lineno);
		} else {
			fprintf(stderr, "* %d [%d] %s\n", lineno, fatal, msg);
		}
	}

	return 0;
}

__attribute__((used)) void setErrorHook() {
	agseterrf(userErrorFunc);
}

/* -- */

__attribute__((used)) void finalizeGVContext() {
	gvFinalize(sVizContext);
	sVizContext = NULL;
}

__attribute__((used)) Agraph_t* getCurentGraph(GVC_t* c) {
	if (!c) {return NULL;}
	return c->gvg->g;
}

__attribute__((used)) node_t* getFirstNode(Agraph_t* g) {
	return agfstnode(g);
}

__attribute__((used)) node_t* getNextNode(Agraph_t* g, node_t* n) {
	return agnxtnode(g, n);
}

__attribute__((used)) Agraph_t* beginGVJob(GVC_t* gvc, short vb, xg_errorFunc efun) {
	gvrender_begin_job(gvc->job);
	Verbose = (vb) ? 1 : 0;
	Y_invert = 1;

	externalErrorFunc = efun;
	setErrorHook();
	return gvNextInputGraph(gvc);
}

__attribute__((used)) void runDotLayout(Agraph_t* g, GVC_t* gvc, xg_askShouldStop stopFunc) {
	DotStats stats;

    GD_gvc(g) = gvc;
    if (g != agroot(g))
		GD_gvc(agroot(g)) = gvc;

	puts("dotLayout - gv_fixLocale");
	gv_fixLocale(1);
	puts("dotLayout - graph_init");
	graph_init(g, gvc->layout.features->flags & LAYOUT_USES_RANKDIR);
	puts("dotLayout - GD_drawing");
	GD_drawing(agroot(g)) = GD_drawing(g);

	stats.iterCount = 0;
	stats.stopFunc  = stopFunc;
	dot_layout_intl(g, &stats);
	// printf("= = = %d\n", stats.iterCount);
//    init_bb(g);
//    init_gvc(gvc, g);
	gvRenderJobs(gvc, g);
}

__attribute__((used)) int testCountNodes(Agraph_t* g) {
	node_t* n;
	int count = 0;
	for (n = getFirstNode(g); n; n = agnxtnode(g, n)) {
		++count;
	}

	return count;
}

__attribute__((used)) int countEdges(Agraph_t* g) {
	node_t* n;
	edge_t* e;
	int count = 0;

	for (n = getFirstNode(g); n; n = agnxtnode(g, n)) {
		for (e = agfstout(g, n); e; e = agnxtout(g, e)) {
			++count;
		}
	}

	return count;
}

static void invertY(graph_t* g, double* Y_off, double* YF_off)
{
	*Y_off = GD_bb(g).UR.y + GD_bb(g).LL.y;
	*YF_off = PS2INCH(*Y_off);
}

void prepare_emit_node(GVJ_t* job, node_t* n)
{
	char *style;
    char **styles = 0;
    char **sp;
    char *p;

	style = late_string(n, N_style, "");
	if (style[0]) {
		styles = parse_style(style);
		sp = styles;
		while ((p = *sp++)) {
			if (streq(p, "invis")) return;
	    }
	}

	if (styles) gvrender_set_style(job, styles);
}

void prepare_emit_edge(GVJ_t* job, edge_t* e)
{
	char *style;
    char **styles = 0;
    char **sp;
    char *p;

	if (!job){return;}

	style = late_string(e, E_style, "");
	if (style[0]) {
	    styles = parse_style(style);

	    sp = styles;
	    while ((p = *sp++)) {
			if (streq(p, "invis")) return;
	    }
	}

	if (styles && ED_spl(e)) gvrender_set_style(job, styles);
}

#define YDIR(y) (local_invert ? (Y_off - (y)) : (y))
#define YFDIR(y) (local_invert ? (YF_off - (y)) : (y))

__attribute__((used)) void extractGraph(
						xg_addNodeFunc addNodeFunc,
						xg_addEdgeFunc addEdgeFunc,
						double* edgeCoords,
						int edgeCoordsArrayLength,
						Agraph_t* g, void* userData) {
	float fontSize;
	node_t* n;
	edge_t *e;
	textlabel_t* lp;
    polygon_t *poly;
	bezier bz;
	double arrowsize;
	int i, ecount, j, pos;
	int arr_over;
	double Y_off;        /* ymin + ymax */
	double YF_off;       /* Y_off in inches */
	GVJ_t* job;
	int local_invert = 1;

	int count = 0;
	pointf coord;
	pointf arr_v;

	job = sVizContext->job;
	init_job_viewport(job, g);
	init_job_pagination(job, g);

	emit_firstlayer(job);
	emit_firstpage(job);
	emit_setup_page(job, g);
	push_obj_state(job);
	invertY(g, &Y_off, &YF_off);

	for (n = getFirstNode(g); n; n = agnxtnode(g, n)) {
		++count;
		fontSize = 0;
		poly = (polygon_t *) ND_shape_info(n);
		coord = ND_coord(n);
		lp = ND_label(n);
		if (lp->u.txt.nparas >= 1) {
			fontSize = lp->u.txt.para[0].fontsize;
		}

		job->obj->penwidth = 1;
		prepare_emit_node(job, n);
		addNodeFunc(n,
			PS2INCH(coord.x), YFDIR(PS2INCH(coord.y)), ND_width(n), ND_height(n),
			poly->sides, poly->peripheries, fontSize, job->obj->penwidth,
			userData);
	}

	for (n = agfstnode(g); n; n = agnxtnode(g, n)) {
		for (e = agfstout(g, n); e; e = agnxtout(g, e)) {
			if (ED_spl(e)) {
				pos = 0;
				arr_over = 0;
				job->obj->pen = 0;
				prepare_emit_edge(job, e);
				ecount = ED_spl(e)->size;
				for (i = 0; i < ecount; i++) {
					if (pos >= (edgeCoordsArrayLength-3)) {
						arr_over = 1;
						break;
					}

					bz = ED_spl(e)->list[i];
					// printf(" ( %d: %d \n", pos, bz.size);
					edgeCoords[pos++] = bz.size;
					for (j = 0; j < bz.size; j++) {
						if (pos >= (edgeCoordsArrayLength-3)) {
							arr_over = 1;
							break;
						}
						coord = bz.list[j];
						edgeCoords[pos++] = PS2INCH(coord.x);
						edgeCoords[pos++] = YFDIR(PS2INCH(coord.y));
						// printf("   ( %f %f \n", coord.x, coord.y);
					}

					if (i == (ecount-1)) {
						arrowsize = late_double(e, E_arrowsz, 1.0, 0.0);
						arr_v = make_arrow_vector(bz.ep, bz.list[bz.size-1], arrowsize);
					}
				}

				edgeCoords[pos++] = job->obj ? job->obj->pen : 0;
				edgeCoords[pos++] = bz.eflag;
				edgeCoords[pos++] = 0;
				addEdgeFunc(e, agtail(e), aghead(e), arr_over ? -1 : pos, arr_v.x, arr_v.y, userData);
			}
		}
	}

	pop_obj_state(job);
}

__attribute__((used)) size_t getEdgeColor(edge_t* e, char* buffer, size_t buflen)
{
	const char* colorName = late_string(e, E_color, "");
	if (!colorName || !colorName[0]) {
		return 0;
	}

	size_t len = strlen(colorName);
	if (len >= (buflen)) { return 0; }

	strcpy(buffer, colorName);
	return len;
}

__attribute__((used)) int getEdgeLabel(Agraph_t* g, edge_t* e, xg_sendEdgeLabelFunc sendFunc)
{
	textlabel_t* lbl = ED_label(e);
	GVJ_t* job = sVizContext->job;
	double bottom;

	if (!lbl) { return 0; }
	bottom = job->translation.y;

	sendFunc(lbl->text, strlen(lbl->text), lbl->fontsize, lbl->space.x, lbl->space.y, lbl->pos.x, -bottom - lbl->pos.y);
	return 1;
}

__attribute__((used)) size_t getNodeName(node_t* nd, char* buffer, size_t buflen)
{
	const char* name = agnameof(nd);
	size_t len = strlen(name);
	if (len >= (buflen)) {
		return 0;
	}

	strcpy(buffer, name);
	return len;
}

__attribute__((used)) double getGraphWidth(GVC_t* gvc) {
	return gvc->bb.UR.x - gvc->bb.LL.x;
}

__attribute__((used)) double getGraphHeight(GVC_t* gvc) {
	return gvc->bb.UR.y - gvc->bb.LL.y;
}

__attribute__((used)) void extractRanks(Agraph_t* g, xg_sendRankNodeFunc sendFunc) {
	int i, r;
	node_t* nd;
	
	//	 printf("nr:  %d\n", GD_maxrank(g));
	for (r = GD_minrank(g); r <= GD_maxrank(g); r++) {
		// printf("xr:  %d\n", r);
		for (i = 0; i < GD_rank(g)[r].n; i++) {
			nd = GD_rank(g)[r].v[i];
			if (nd) {
				// printf("   nd:  %p %s\n", nd, agnameof(nd));
				sendFunc(r, nd, (ND_node_type(nd) == VIRTUAL) ? 1 : 0, ND_coord(nd).x);
			}
		}
	}
}

__attribute__((used)) void extractEdgesEarly(Agraph_t* g, xg_sendEdgeEarly sendFunc) {
	node_t* n;
	edge_t *e;
	int i, j, r;
	
	for (r = GD_minrank(g); r <= GD_maxrank(g); r++) {
		for (j = 0; j < GD_rank(g)[r].n; j++) {
			n = GD_rank(g)[r].v[j];

			for (i = 0; (e = ND_out(n).list[i]); i++) {
				sendFunc(e, agtail(e), aghead(e));
			}
		}
/*
		for (e = agfstout(g, n); e; e = agnxtout(g, e)) {
			sendFunc(e, agtail(e), aghead(e));
		}
*/
	}
}
