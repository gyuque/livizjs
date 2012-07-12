#include "dot.h"
#include "gvc.h"
#include "gvio.h"

#define TAILX 1
#define HEADX 2

#include <stdio.h>
#include "liviz-apis/liviz-apis.h"

extern int agwrite(Agraph_t *, FILE *);
graph_t *create_test_graph(void);
void testDump(Agraph_t *);


lt_symlist_t lt_preloaded_symbols[] = { { 0, 0 } };


int main(int argc, char **argv) {
	Agraph_t* g;
	GVC_t* gvc;

	gvc = prepareGVContext();
	g = beginGVJob(gvc, 1, NULL);

	finalizeGVContext();

	return 0;
}
