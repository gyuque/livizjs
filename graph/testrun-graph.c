#include "gvc.h"
#include "gvio.h"
extern int agwrite(Agraph_t *, FILE *);
graph_t *create_test_graph(void);
void testDump(Agraph_t* g);

int main() {
	Agraph_t* g;

	aginit();
	g = create_test_graph();
//	agwrite(g, stderr);
	testDump(g);

	return 0;
}





void testDump(Agraph_t* g) {
	node_t *n;
	edge_t *e;
	bezier bz;
    char *tport, *hport;
	int splinePoints, i, j;

	for (n = agfstnode(g); n; n = agnxtnode(g, n)) {
		for (e = agfstout(g, n); e; e = agnxtout(g, e)) {
			printf("%s > %s\n", agnameof(agtail(e)), agnameof(aghead(e)));
		}
	}

}





graph_t *create_test_graph(void)
{
#define NUMNODES 5

    Agnode_t *node[NUMNODES];
    Agraph_t *g;
    int j, k;
    char name[10];

    /* Create a new graph */
#ifndef WITH_CGRAPH
    aginit();
    // agsetiodisc(NULL, gvfwrite, gvferror);
    g = agopen("new_graph", AGDIGRAPH);
#else /* WITH_CGRAPH */
    g = agopen("new_graph", Agdirected,NIL(Agdisc_t *));
#endif /* WITH_CGRAPH */

    /* Add nodes */
    for (j = 0; j < NUMNODES; j++) {
	sprintf(name, "%d", j);
#ifndef WITH_CGRAPH
	node[j] = agnode(g, name);
#else /* WITH_CGRAPH */
	node[j] = agnode(g, name, 1);
	agbindrec(node[j], "Agnodeinfo_t", sizeof(Agnodeinfo_t), TRUE);	//node custom data

#endif /* WITH_CGRAPH */
    }

    /* Connect nodes */
    for (j = 0; j < NUMNODES; j++) {
	for (k = j + 1; k < NUMNODES; k++) {
#ifndef WITH_CGRAPH
	    agedge(g, node[j], node[k]);
		printf("%d -> %d\n", j, k);
#else /* WITH_CGRAPH */
	    agedge(g, node[j], node[k], NULL, 1);
#endif /* WITH_CGRAPH */

	}
    }

    aginsert (g, node[0]);

    return g;
}