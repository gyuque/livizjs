#include "dot.h"
#include "gvc.h"
#include "gvio.h"


#include <stdio.h>
#include "liviz-apis/liviz-apis.h"


int main(int argc, char **argv) {
	Agraph_t* g;
	GVC_t* gvc;

	gvc = prepareGVContext(0);
	printf("%p\n", gvc);
	g = beginGVJob(gvc, 1, NULL);
	printf("%p\n", g);

	runDotLayout(g, gvc, NULL);

	finalizeGVContext();

	return 0;
}
