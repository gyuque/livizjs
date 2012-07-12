
typedef void (*xg_sendRankNodeFunc)(int rank, node_t* nd, int isVirtualNode, double coordX);
typedef void (*xg_errorFunc)(int fatal, int lineno);
typedef void (*xg_addNodeFunc)(node_t* n, float x, float y, float w, float h,
	int sides, int nPeripheries,
	float labelFontSize, float penWidth, void* userData);
typedef void (*xg_sendEdgeEarly)(edge_t* pE, node_t* n1, node_t* n2);
typedef void (*xg_addEdgeFunc)(edge_t* pE, node_t* n1, node_t* n2, int edgeDataLength, double arrX, double arrY, void* userData);
typedef void (*xg_sendEdgeLabelFunc)(char* text, size_t textLen, double fontSize, double spaceX, double spaceY, double posX, double posY);

GVC_t* prepareGVContext(int useTestFile);
void finalizeGVContext();
Agraph_t* getCurentGraph(GVC_t* c);
Agraph_t* beginGVJob(GVC_t* gvc, short vb, xg_errorFunc efun);
node_t* getFirstNode(Agraph_t* g);
void runDotLayout(Agraph_t* g, GVC_t* gvc, xg_askShouldStop stopFunc);
